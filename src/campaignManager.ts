/**
 * Campaign Manager - Orchestrates the HR Outreach System
 */
import Database from 'better-sqlite3';
import { getDatabase } from './database/init.js';
import { ContactRepository } from './database/contacts.js';
import { EmailEngine, SendResult } from './email/engine.js';
import { EmailLogRepository } from './email/logRepository.js';
import { TemplateEngine, TemplateVariables } from './templates/engine.js';
import { SchedulerEngine, ScheduleOptions } from './scheduler/engine.js';
import { AnalyticsTracker } from './analytics/tracker.js';
import type { 
  Contact, 
  ContactSearchFilters,
  EmailTemplate,
  EmailCampaign,
  TimeWindow,
  EmailPayload
} from './types/index.js';

export interface CampaignConfig {
  name: string;
  description?: string;
  templateId?: string;
  targetSkills: string[];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  dailyLimit: number;
  timezone: string;
  optimalSendWindow: TimeWindow;
  senderName: string;
  senderTitle: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
}

export interface SendOptions {
  dryRun?: boolean;
  respectOptimalTime?: boolean;
  staggerMinutes?: number;
  skipDuplicates?: boolean;
}

export class CampaignManager {
  private db: Database.Database;
  private contacts: ContactRepository;
  private emailEngine: EmailEngine;
  private emailLogs: EmailLogRepository;
  private templates: TemplateEngine;
  private scheduler: SchedulerEngine;
  private analytics: AnalyticsTracker;
  
  constructor(db?: Database.Database, emailConfig?: { dryRun?: boolean }) {
    this.db = db || getDatabase();
    this.contacts = new ContactRepository(this.db);
    this.emailEngine = new EmailEngine({ dryRun: emailConfig?.dryRun });
    this.emailLogs = new EmailLogRepository(this.db);
    this.templates = new TemplateEngine(this.db);
    this.scheduler = new SchedulerEngine(this.db);
    this.analytics = new AnalyticsTracker(this.db);
  }
  
  // ==================== Contact Management ====================
  
  importContacts(contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]): Contact[] {
    return this.contacts.createBatch(contacts);
  }
  
  findContacts(filters: ContactSearchFilters): Contact[] {
    return this.contacts.find(filters);
  }
  
  getContactStats() {
    return this.contacts.getStats();
  }
  
  // ==================== Template Management ====================
  
  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    return this.templates.create(template);
  }
  
  getBestTemplateForContact(contact: Contact): EmailTemplate | null {
    return this.templates.getBestTemplate(contact);
  }
  
  setupDefaultTemplates(): EmailTemplate[] {
    return this.templates.createDefaultTemplates();
  }
  
  // ==================== Campaign Creation ====================
  
  createCampaign(config: CampaignConfig): { campaignId: string; contactsCount: number; scheduledCount: number } {
    const campaignId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Insert campaign record
    const stmt = this.db.prepare(`
      INSERT INTO email_campaigns (
        id, name, description, template_id, target_skills,
        min_experience_years, max_experience_years, status,
        daily_limit, timezone, optimal_send_window, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      campaignId,
      config.name,
      config.description || null,
      config.templateId || null,
      JSON.stringify(config.targetSkills),
      config.minExperienceYears || null,
      config.maxExperienceYears || null,
      'scheduled',
      config.dailyLimit,
      config.timezone,
      JSON.stringify(config.optimalSendWindow),
      now,
      now
    );
    
    // Find matching contacts
    const filters: ContactSearchFilters = {
      skills: config.targetSkills,
      status: ['new'],
      minExperienceYears: config.minExperienceYears,
      maxExperienceYears: config.maxExperienceYears
    };
    
    const targetContacts = this.contacts.find(filters, config.dailyLimit);
    
    // Schedule emails for each contact
    let scheduledCount = 0;
    const staggerTimes = this.scheduler.staggerSchedules(
      this.scheduler.calculateOptimalTime(targetContacts[0] || {} as Contact, config.optimalSendWindow),
      targetContacts.length,
      5
    );
    
    for (let i = 0; i < targetContacts.length; i++) {
      const contact = targetContacts[i];
      const template = config.templateId 
        ? this.templates.getById(config.templateId)
        : this.templates.getBestTemplate(contact);
      
      if (!template) continue;
      
      // Render email
      const variables: TemplateVariables = {
        contact,
        senderName: config.senderName,
        senderTitle: config.senderTitle,
        companyName: config.companyName,
        jobTitle: config.jobTitle,
        jobDescription: config.jobDescription
      };
      
      const payload = this.templates.render(template, variables);
      
      // Create email log
      const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const emailLog = this.emailLogs.create({
        campaignId,
        contactId: contact.id,
        templateId: template.id,
        subject: payload.subject,
        body: payload.body,
        status: 'pending',
        trackingId
      });
      
      // Schedule the email
      this.scheduler.schedule(
        emailLog.id,
        contact.id,
        staggerTimes[i],
        { priority: contact.priority, timezone: config.timezone }
      );
      
      // Update contact status
      this.contacts.update(contact.id, { status: 'contacted' });
      scheduledCount++;
    }
    
    return {
      campaignId,
      contactsCount: targetContacts.length,
      scheduledCount
    };
  }
  
  // ==================== Immediate Sending ====================
  
  async sendToContacts(
    contactIds: string[],
    templateId: string,
    variables: Omit<TemplateVariables, 'contact'>,
    options: SendOptions = {}
  ): Promise<{ results: SendResult[]; logs: any[] }> {
    const template = this.templates.getById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const results: SendResult[] = [];
    const logs: any[] = [];
    
    for (const contactId of contactIds) {
      const contact = this.contacts.getById(contactId);
      if (!contact) {
        console.warn(`Contact not found: ${contactId}`);
        continue;
      }
      
      // Check for duplicates
      if (options.skipDuplicates) {
        const existing = this.emailLogs.findByContact(contactId);
        if (existing.some(e => e.templateId === templateId && e.status !== 'failed')) {
          console.log(`Skipping duplicate for ${contact.email}`);
          continue;
        }
      }
      
      // Render email
      const fullVariables: TemplateVariables = {
        ...variables,
        contact
      };
      const payload = this.templates.render(template, fullVariables);
      
      // Create email log
      const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const emailLog = this.emailLogs.create({
        contactId: contact.id,
        templateId: template.id,
        subject: payload.subject,
        body: payload.body,
        status: 'pending',
        trackingId
      });
      
      // Send email
      const result = await this.emailEngine.sendEmail({
        ...payload,
        trackingId
      });
      
      // Update log
      this.emailLogs.updateStatus(
        emailLog.id,
        result.success ? 'sent' : 'failed',
        result.error ? { errorMessage: result.error } : undefined
      );
      
      // Track analytics
      if (result.success) {
        this.analytics.trackEmailSent(emailLog.id);
        this.contacts.updateStatus(contact.id, 'contacted');
      }
      
      results.push(result);
      logs.push({ contact: contact.email, result, trackingId });
      
      // Stagger sends
      if (options.staggerMinutes && contactId !== contactIds[contactIds.length - 1]) {
        await this.sleep(options.staggerMinutes * 60 * 1000);
      }
    }
    
    return { results, logs };
  }
  
  // ==================== Scheduled Sending ====================
  
  async processScheduledEmails(batchSize = 10): Promise<{ processed: number; successful: number; failed: number }> {
    const pending = this.scheduler.findPending(batchSize);
    let successful = 0;
    let failed = 0;
    
    for (const scheduled of pending) {
      this.scheduler.updateStatus(scheduled.id, 'sending');
      
      const emailLog = this.emailLogs.getById(scheduled.emailLogId);
      if (!emailLog) {
        this.scheduler.updateStatus(scheduled.id, 'failed');
        failed++;
        continue;
      }
      
      const result = await this.emailEngine.sendEmail({
        to: emailLog.body.match(/To:\s*(.+)/)?.[1] || '',
        subject: emailLog.subject,
        body: emailLog.body,
        trackingId: emailLog.trackingId
      });
      
      if (result.success) {
        this.scheduler.updateStatus(scheduled.id, 'sent');
        this.emailLogs.updateStatus(emailLog.id, 'sent');
        this.analytics.trackEmailSent(emailLog.id);
        successful++;
      } else {
        this.scheduler.updateStatus(scheduled.id, 'failed');
        this.emailLogs.updateStatus(emailLog.id, 'failed', { errorMessage: result.error });
        failed++;
      }
    }
    
    return {
      processed: pending.length,
      successful,
      failed
    };
  }
  
  // ==================== Analytics ====================
  
  getDashboardSummary() {
    return this.analytics.getDashboardSummary();
  }
  
  getCampaignSummary(campaignId?: string) {
    return this.analytics.getCampaignSummary(campaignId);
  }
  
  getContactEngagement(contactId: string) {
    return this.analytics.getContactEngagement(contactId);
  }
  
  getTrends(days = 30) {
    return this.analytics.getTrends(days);
  }
  
  // ==================== Tracking ====================
  
  trackOpen(trackingId: string): boolean {
    const success = this.emailLogs.markAsOpened(trackingId);
    if (success) {
      this.analytics.trackEmailOpened(trackingId);
    }
    return success;
  }
  
  trackClick(trackingId: string): boolean {
    const success = this.emailLogs.markAsClicked(trackingId);
    if (success) {
      this.analytics.trackEmailClicked(trackingId);
    }
    return success;
  }
  
  // ==================== Utilities ====================
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async verifySetup(): Promise<{ ok: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check database
    try {
      this.db.prepare('SELECT 1').get();
    } catch (e) {
      issues.push('Database not initialized');
    }
    
    // Check GWS CLI
    const gwsCheck = await this.emailEngine.verifyGWS();
    if (!gwsCheck.available) {
      issues.push(`GWS CLI not available: ${gwsCheck.error}`);
    }
    
    return { ok: issues.length === 0, issues };
  }
}
