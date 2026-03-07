/**
 * HR Outreach Automation Engine
 * Main entry point
 */

// Export types
export * from './types/index.js';

// Export engines
export { getDatabase, initializeDatabase, closeDatabase } from './database/init.js';
export { ContactRepository } from './database/contacts.js';
export { EmailEngine, SendResult } from './email/engine.js';
export { EmailLogRepository } from './email/logRepository.js';
export { TemplateEngine, TemplateVariables } from './templates/engine.js';
export { SchedulerEngine, ScheduleOptions } from './scheduler/engine.js';
export { AnalyticsTracker, CampaignSummary, ContactEngagement, TrendData } from './analytics/tracker.js';
export { CampaignManager, CampaignConfig, SendOptions } from './campaignManager.js';

// Export utilities
export * from './utils/index.js';

import { initializeDatabase } from './database/init.js';
import { CampaignManager } from './campaignManager.js';

/**
 * Initialize the HR Outreach System
 */
export async function initializeSystem(): Promise<{ success: boolean; error?: string }> {
  try {
    initializeDatabase();
    console.log('✓ HR Outreach System initialized');
    return { success: true };
  } catch (error: any) {
    console.error('✗ Failed to initialize:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Quick start helper - creates manager and sets up defaults
 */
export async function quickStart(): Promise<{
  manager: CampaignManager;
  defaultsCreated: boolean;
}> {
  await initializeSystem();
  
  const manager = new CampaignManager();
  
  // Check if we have templates
  const templates = manager['templates'].findAll();
  let defaultsCreated = false;
  
  if (templates.length === 0) {
    manager.setupDefaultTemplates();
    defaultsCreated = true;
    console.log('✓ Default templates created');
  }
  
  return { manager, defaultsCreated };
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('HR Outreach Automation Engine v1.0.0\n');
  
  initializeSystem().then(async ({ success }) => {
    if (!success) {
      process.exit(1);
    }
    
    const { manager, defaultsCreated } = await quickStart();
    
    console.log('\n📊 System Status:');
    console.log('----------------');
    
    const setup = await manager.verifySetup();
    console.log(`Database: ${setup.ok ? '✓' : '✗'}`);
    console.log(`GWS CLI: ${setup.issues.some(i => i.includes('GWS')) ? '⚠ Not configured' : '✓'}`);
    
    const stats = manager.getContactStats();
    console.log(`\nContacts: ${stats.total}`);
    console.log(`Templates: ${manager['templates'].findAll().length}`);
    
    const dashboard = manager.getDashboardSummary();
    console.log(`\nPending Scheduled: ${dashboard.pendingScheduled}`);
    console.log(`Emails Sent Today: ${dashboard.emailsSentToday}`);
    console.log(`Open Rate (30d): ${dashboard.openRate.toFixed(1)}%`);
    
    console.log('\n✓ System ready for use');
    console.log('\nExample usage:');
    console.log('  import { CampaignManager } from "./index.js"');
    console.log('  const manager = new CampaignManager();');
    console.log('  await manager.sendToContacts([...], templateId, {...});');
  });
}
