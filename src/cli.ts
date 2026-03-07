/**
 * CLI Interface for HR Outreach System
 */
import { CampaignManager } from './campaignManager.js';
import { initializeDatabase, getDatabase } from './database/init.js';
import { ContactRepository } from './database/contacts.js';
import { TemplateEngine } from './templates/engine.js';
import { SchedulerEngine } from './scheduler/engine.js';
import { AnalyticsTracker } from './analytics/tracker.js';
import { parseSkills } from './utils/index.js';
import type { Contact, ContactSearchFilters } from './types/index.js';

const command = process.argv[2];
const args = process.argv.slice(3);

function printHelp() {
  console.log(`
HR Outreach Automation Engine - CLI

Commands:
  init                    Initialize the database
  
  contacts:add            Add contacts from JSON file
    --file, -f            Path to JSON file
    
  contacts:list           List contacts
    --status              Filter by status
    --skills              Filter by skills (comma-separated)
    --limit               Max results (default: 50)
    
  contacts:stats          Show contact statistics
  
  templates:list          List all templates
  templates:add           Add a template from JSON file
    --file, -f            Path to JSON file
  templates:defaults      Create default templates
  
  campaign:create         Create a new campaign
    --name                Campaign name
    --skills              Target skills (comma-separated)
    --template            Template ID
    --daily-limit         Max emails per day (default: 50)
    
  send:immediate          Send emails immediately
    --contacts            Contact IDs (comma-separated) or 'all'
    --template            Template ID
    --dry-run             Simulate without sending
    
  send:scheduled          Process scheduled emails
    --batch-size          Number to process (default: 10)
    
  schedule:add            Schedule emails for contacts
    --contacts            Contact IDs (comma-separated)
    --template            Template ID
    --date                Schedule date (YYYY-MM-DD)
    
  analytics:dashboard     Show dashboard summary
  analytics:campaign      Show campaign analytics
    --id                  Campaign ID (optional)
  analytics:trends        Show trends
    --days                Number of days (default: 30)
    
  export:csv              Export analytics to CSV
    --start               Start date (YYYY-MM-DD)
    --end                 End date (YYYY-MM-DD)
    
  help                    Show this help message
`);
}

async function main() {
  switch (command) {
    case 'init':
      await initializeDatabase();
      break;
      
    case 'contacts:list': {
      const db = getDatabase();
      const repo = new ContactRepository(db);
      
      const filters: ContactSearchFilters = {};
      const statusIdx = args.indexOf('--status');
      if (statusIdx >= 0) filters.status = args[statusIdx + 1].split(',') as any;
      
      const skillsIdx = args.indexOf('--skills');
      if (skillsIdx >= 0) filters.skills = parseSkills(args[skillsIdx + 1]);
      
      const limitIdx = args.indexOf('--limit');
      const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 50;
      
      const contacts = repo.find(filters, limit);
      console.table(contacts.map(c => ({
        id: c.id.slice(0, 8),
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        status: c.status,
        priority: c.priority,
        skills: c.skills.slice(0, 3).join(', ') + (c.skills.length > 3 ? '...' : '')
      })));
      break;
    }
    
    case 'contacts:stats': {
      const db = getDatabase();
      const repo = new ContactRepository(db);
      const stats = repo.getStats();
      console.log('Contact Statistics:');
      console.log('-------------------');
      console.log(`Total: ${stats.total}`);
      console.log('\nBy Status:', stats.byStatus);
      console.log('\nBy Priority:', stats.byPriority);
      break;
    }
    
    case 'templates:list': {
      const db = getDatabase();
      const engine = new TemplateEngine(db);
      const templates = engine.findAll();
      console.table(templates.map(t => ({
        id: t.id.slice(0, 8),
        name: t.name,
        type: t.type,
        tone: t.tone,
        skills: t.requiredSkills.slice(0, 3).join(', ') + (t.requiredSkills.length > 3 ? '...' : '')
      })));
      break;
    }
    
    case 'templates:defaults': {
      const db = getDatabase();
      const engine = new TemplateEngine(db);
      const templates = engine.createDefaultTemplates();
      console.log(`Created ${templates.length} default templates:`);
      templates.forEach(t => console.log(`  - ${t.name}`));
      break;
    }
    
    case 'analytics:dashboard': {
      const db = getDatabase();
      const tracker = new AnalyticsTracker(db);
      const summary = tracker.getDashboardSummary();
      console.log('Dashboard Summary');
      console.log('-----------------');
      console.log(`Total Contacts: ${summary.totalContacts}`);
      console.log(`Emails Today: ${summary.emailsSentToday}`);
      console.log(`This Week: ${summary.emailsSentThisWeek}`);
      console.log(`Open Rate: ${summary.openRate.toFixed(1)}%`);
      console.log(`Click Rate: ${summary.clickRate.toFixed(1)}%`);
      console.log(`Pending Scheduled: ${summary.pendingScheduled}`);
      console.log('\nTop Engaged Contacts:');
      summary.topEngaged.forEach(c => {
        console.log(`  - ${c.firstName} ${c.lastName}: ${c.engagementScore}% engagement`);
      });
      break;
    }
    
    case 'campaign:create': {
      const manager = new CampaignManager();
      
      const nameIdx = args.indexOf('--name');
      const skillsIdx = args.indexOf('--skills');
      const templateIdx = args.indexOf('--template');
      const limitIdx = args.indexOf('--daily-limit');
      
      if (nameIdx < 0 || skillsIdx < 0) {
        console.error('Usage: campaign:create --name "Campaign Name" --skills "skill1,skill2"');
        process.exit(1);
      }
      
      const result = manager.createCampaign({
        name: args[nameIdx + 1],
        targetSkills: parseSkills(args[skillsIdx + 1]),
        templateId: templateIdx >= 0 ? args[templateIdx + 1] : undefined,
        dailyLimit: limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 50,
        timezone: 'America/New_York',
        optimalSendWindow: SchedulerEngine.createDefaultTimeWindow(),
        senderName: 'Hiring Manager',
        senderTitle: 'Talent Acquisition',
        companyName: 'Tech Corp',
        jobTitle: 'Software Engineer'
      });
      
      console.log('Campaign Created!');
      console.log(`ID: ${result.campaignId}`);
      console.log(`Contacts Matched: ${result.contactsCount}`);
      console.log(`Emails Scheduled: ${result.scheduledCount}`);
      break;
    }
    
    case 'send:scheduled': {
      const manager = new CampaignManager();
      const batchIdx = args.indexOf('--batch-size');
      const batchSize = batchIdx >= 0 ? parseInt(args[batchIdx + 1]) : 10;
      
      console.log(`Processing scheduled emails (batch size: ${batchSize})...`);
      const result = await manager.processScheduledEmails(batchSize);
      console.log(`Processed: ${result.processed}`);
      console.log(`Successful: ${result.successful}`);
      console.log(`Failed: ${result.failed}`);
      break;
    }
    
    case 'help':
    default:
      printHelp();
  }
}

main().catch(console.error);
