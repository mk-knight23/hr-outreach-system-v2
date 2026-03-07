import { db } from './database';
import { emailEngine } from './email/engine';
import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'engine.log') }),
    new winston.transports.Console()
  ]
});

interface CampaignConfig {
  mode: 'research' | 'send' | 'followup' | 'full';
  maxEmails?: number;
  dryRun?: boolean;
}

class OutreachEngine {
  private isRunning = false;

  async initialize(): Promise<void> {
    logger.info('🚀 Initializing HR Outreach Engine v2...');
    
    await db.initialize();
    await emailEngine.initialize();
    
    logger.info('✅ Engine initialized successfully');
  }

  async runCampaign(config: CampaignConfig): Promise<void> {
    if (this.isRunning) {
      logger.warn('Campaign already running. Skipping...');
      return;
    }

    this.isRunning = true;
    logger.info(`📊 Starting campaign: ${config.mode} mode`);

    try {
      switch (config.mode) {
        case 'research':
          await this.runResearch();
          break;
        case 'send':
          await this.runSendEmails(config.maxEmails, config.dryRun);
          break;
        case 'followup':
          await this.runFollowUps(config.dryRun);
          break;
        case 'full':
          await this.runFullPipeline(config.maxEmails, config.dryRun);
          break;
      }
    } catch (error: any) {
      logger.error(`Campaign failed: ${error.message}`);
    } finally {
      this.isRunning = false;
      logger.info('🏁 Campaign completed');
    }
  }

  private async runResearch(): Promise<void> {
    logger.info('🔍 Running research phase...');
    // Research agent will populate contacts
    // For now, this is a placeholder
    logger.info('✅ Research phase completed');
  }

  private async runSendEmails(maxEmails: number = 10, dryRun: boolean = false): Promise<void> {
    logger.info(`📧 Sending emails (max: ${maxEmails}, dry run: ${dryRun})...`);
    
    const contacts = await db.getContactsToEmail(maxEmails);
    logger.info(`Found ${contacts.length} contacts to email`);

    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      if (!emailEngine.canSend()) {
        logger.warn('Daily email limit reached. Stopping...');
        break;
      }

      const result = await emailEngine.sendEmail(contact, false, 0);
      
      if (result.success) {
        sent++;
        // Add delay between emails (30-60 seconds)
        await this.delay(30000 + Math.random() * 30000);
      } else {
        failed++;
      }
    }

    logger.info(`📊 Send complete: ${sent} sent, ${failed} failed`);
  }

  private async runFollowUps(dryRun: boolean = false): Promise<void> {
    logger.info('🔄 Running follow-up sequences...');
    
    const followUpDays = [3, 7, 14];
    
    for (const days of followUpDays) {
      const contacts = await db.getContactsForFollowUp(days, 5);
      logger.info(`Found ${contacts.length} contacts for ${days}-day follow-up`);

      for (const contact of contacts) {
        if (!emailEngine.canSend()) {
          logger.warn('Daily email limit reached. Stopping follow-ups...');
          return;
        }

        const result = await emailEngine.sendFollowUp(contact, days);
        
        if (result.success) {
          // Add delay between emails
          await this.delay(30000 + Math.random() * 30000);
        }
      }
    }

    logger.info('✅ Follow-up phase completed');
  }

  private async runFullPipeline(maxEmails: number = 10, dryRun: boolean = false): Promise<void> {
    logger.info('🚀 Running full pipeline...');
    
    // 1. Check for replies
    await emailEngine.checkReplies();
    
    // 2. Send follow-ups
    await this.runFollowUps(dryRun);
    
    // 3. Send new emails
    await this.runSendEmails(maxEmails, dryRun);
    
    // 4. Generate stats
    await this.generateReport();
    
    logger.info('✅ Full pipeline completed');
  }

  private async generateReport(): Promise<void> {
    const stats = await db.getStats();
    
    logger.info('📊 Current Stats:', stats);
    
    // Save to file
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      dailyQuota: {
        limit: emailEngine.getRemainingQuota() + (parseInt(process.env.DAILY_EMAIL_LIMIT || '100') - emailEngine.getRemainingQuota()),
        remaining: emailEngine.getRemainingQuota(),
        used: parseInt(process.env.DAILY_EMAIL_LIMIT || '100') - emailEngine.getRemainingQuota()
      }
    };

    const reportsDir = path.join(__dirname, '../analytics/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logger.info(`📄 Report saved to ${reportPath}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    logger.info('👋 Shutting down engine...');
    await db.close();
  }
}

// Main execution
async function main() {
  const engine = new OutreachEngine();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await engine.shutdown();
    process.exit(0);
  });

  await engine.initialize();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = (args.find(a => !a.startsWith('--')) as CampaignConfig['mode']) || 'full';
  const dryRun = args.includes('--dry-run');
  const maxEmails = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '10');

  await engine.runCampaign({ mode, maxEmails, dryRun });
  await engine.shutdown();
}

if (require.main === module) {
  main().catch(console.error);
}

export { OutreachEngine };
