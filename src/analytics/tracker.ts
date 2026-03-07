/**
 * Analytics Tracker for Email Campaign Performance
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { AnalyticsMetrics, EmailLog, ScheduledEmail } from '../types/index.js';

export interface CampaignSummary {
  campaignId?: string;
  campaignName?: string;
  totalEmails: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate: number;
  period: { start: Date; end: Date };
}

export interface TrendData {
  date: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  responseRate: number;
}

export interface ContactEngagement {
  contactId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailsReceived: number;
  emailsOpened: number;
  emailsClicked: number;
  lastEngagement?: Date;
  engagementScore: number;
}

export class AnalyticsTracker {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  // ==================== Daily Metrics ====================
  
  recordMetrics(metrics: Omit<AnalyticsMetrics, 'id' | 'createdAt' | 'updatedAt'>): void {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO analytics (
        id, date, campaign_id, emails_sent, emails_delivered, emails_opened,
        emails_clicked, emails_bounced, emails_failed, responses_received,
        positive_responses, negative_responses, avg_response_time_hours,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, campaign_id) DO UPDATE SET
        emails_sent = emails_sent + excluded.emails_sent,
        emails_delivered = emails_delivered + excluded.emails_delivered,
        emails_opened = emails_opened + excluded.emails_opened,
        emails_clicked = emails_clicked + excluded.emails_clicked,
        emails_bounced = emails_bounced + excluded.emails_bounced,
        emails_failed = emails_failed + excluded.emails_failed,
        responses_received = responses_received + excluded.responses_received,
        positive_responses = positive_responses + excluded.positive_responses,
        negative_responses = negative_responses + excluded.negative_responses,
        updated_at = excluded.updated_at
    `);
    
    stmt.run(
      id,
      metrics.date,
      metrics.campaignId || null,
      metrics.emailsSent,
      metrics.emailsDelivered,
      metrics.emailsOpened,
      metrics.emailsClicked,
      metrics.emailsBounced,
      metrics.emailsFailed,
      metrics.responsesReceived,
      metrics.positiveResponses,
      metrics.negativeResponses,
      metrics.avgResponseTimeHours || null,
      now,
      now
    );
  }
  
  getMetrics(date: string, campaignId?: string): AnalyticsMetrics | null {
    const whereClause = campaignId ? 'AND campaign_id = ?' : 'AND campaign_id IS NULL';
    const params = campaignId ? [date, campaignId] : [date];
    
    const row = this.db.prepare(`
      SELECT * FROM analytics WHERE date = ? ${whereClause}
    `).get(...params);
    
    if (!row) return null;
    
    return {
      date: row.date,
      campaignId: row.campaign_id,
      emailsSent: row.emails_sent,
      emailsDelivered: row.emails_delivered,
      emailsOpened: row.emails_opened,
      emailsClicked: row.emails_clicked,
      emailsBounced: row.emails_bounced,
      emailsFailed: row.emails_failed,
      responsesReceived: row.responses_received,
      positiveResponses: row.positive_responses,
      negativeResponses: row.negative_responses,
      avgResponseTimeHours: row.avg_response_time_hours
    };
  }
  
  getMetricsRange(startDate: string, endDate: string, campaignId?: string): AnalyticsMetrics[] {
    const whereClause = campaignId ? 'AND campaign_id = ?' : '';
    const params = campaignId ? [startDate, endDate, campaignId] : [startDate, endDate];
    
    const rows = this.db.prepare(`
      SELECT * FROM analytics 
      WHERE date BETWEEN ? AND ? ${whereClause}
      ORDER BY date
    `).all(...params);
    
    return rows.map(row => ({
      date: row.date,
      campaignId: row.campaign_id,
      emailsSent: row.emails_sent,
      emailsDelivered: row.emails_delivered,
      emailsOpened: row.emails_opened,
      emailsClicked: row.emails_clicked,
      emailsBounced: row.emails_bounced,
      emailsFailed: row.emails_failed,
      responsesReceived: row.responses_received,
      positiveResponses: row.positive_responses,
      negativeResponses: row.negative_responses,
      avgResponseTimeHours: row.avg_response_time_hours
    }));
  }
  
  // ==================== Campaign Summary ====================
  
  getCampaignSummary(campaignId?: string, days = 30): CampaignSummary {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const whereClause = campaignId ? 'WHERE el.campaign_id = ?' : 'WHERE el.campaign_id IS NULL';
    const params = campaignId ? [campaignId] : [];
    
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('sent', 'delivered', 'opened', 'clicked') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status IN ('opened', 'clicked') THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked,
        SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM email_logs el
      ${whereClause}
      AND el.created_at >= datetime('now', '-${days} days')
    `).get(...params) as any;
    
    const total = stats.total || 0;
    const sent = stats.sent || 0;
    const delivered = stats.delivered || 0;
    const opened = stats.opened || 0;
    const clicked = stats.clicked || 0;
    const bounced = stats.bounced || 0;
    const failed = stats.failed || 0;
    
    let campaignName: string | undefined;
    if (campaignId) {
      const campaign = this.db.prepare('SELECT name FROM email_campaigns WHERE id = ?').get(campaignId) as any;
      campaignName = campaign?.name;
    }
    
    return {
      campaignId,
      campaignName,
      totalEmails: total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      period: { start: startDate, end: endDate }
    };
  }
  
  getAllCampaignSummaries(days = 30): CampaignSummary[] {
    const campaigns = this.db.prepare(`
      SELECT id FROM email_campaigns
    `).all() as any[];
    
    return campaigns.map(c => this.getCampaignSummary(c.id, days));
  }
  
  // ==================== Trends ====================
  
  getTrends(days = 30): TrendData[] {
    const rows = this.db.prepare(`
      SELECT 
        date,
        emails_sent,
        emails_opened,
        emails_clicked,
        CASE 
          WHEN emails_sent > 0 THEN (responses_received * 100.0 / emails_sent)
          ELSE 0 
        END as response_rate
      FROM analytics
      WHERE date >= date('now', '-${days} days')
      ORDER BY date
    `).all() as any[];
    
    return rows.map(row => ({
      date: row.date,
      emailsSent: row.emails_sent,
      emailsOpened: row.emails_opened,
      emailsClicked: row.emails_clicked,
      responseRate: parseFloat(row.response_rate.toFixed(2))
    }));
  }
  
  // ==================== Contact Engagement ====================
  
  getContactEngagement(contactId: string): ContactEngagement | null {
    const row = this.db.prepare(`
      SELECT 
        c.id, c.email, c.first_name, c.last_name,
        COUNT(el.id) as emails_received,
        SUM(CASE WHEN el.status IN ('opened', 'clicked') THEN 1 ELSE 0 END) as emails_opened,
        SUM(CASE WHEN el.status = 'clicked' THEN 1 ELSE 0 END) as emails_clicked,
        MAX(CASE WHEN el.status IN ('opened', 'clicked') THEN el.opened_at END) as last_engagement
      FROM contacts c
      LEFT JOIN email_logs el ON c.id = el.contact_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(contactId) as any;
    
    if (!row) return null;
    
    const received = row.emails_received || 0;
    const opened = row.emails_opened || 0;
    const clicked = row.emails_clicked || 0;
    
    // Engagement score: 0-100
    let score = 0;
    if (received > 0) {
      score += (opened / received) * 50; // 50% weight on opens
      score += (clicked / received) * 50; // 50% weight on clicks
    }
    
    return {
      contactId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      emailsReceived: received,
      emailsOpened: opened,
      emailsClicked: clicked,
      lastEngagement: row.last_engagement ? new Date(row.last_engagement) : undefined,
      engagementScore: Math.round(score)
    };
  }
  
  getTopEngagedContacts(limit = 10): ContactEngagement[] {
    const rows = this.db.prepare(`
      SELECT 
        c.id, c.email, c.first_name, c.last_name,
        COUNT(el.id) as emails_received,
        SUM(CASE WHEN el.status IN ('opened', 'clicked') THEN 1 ELSE 0 END) as emails_opened,
        SUM(CASE WHEN el.status = 'clicked' THEN 1 ELSE 0 END) as emails_clicked,
        MAX(CASE WHEN el.status IN ('opened', 'clicked') THEN el.opened_at END) as last_engagement
      FROM contacts c
      LEFT JOIN email_logs el ON c.id = el.contact_id
      GROUP BY c.id
      HAVING emails_received > 0
      ORDER BY emails_opened DESC, emails_clicked DESC
      LIMIT ?
    `).all(limit) as any[];
    
    return rows.map(row => {
      const received = row.emails_received || 0;
      const opened = row.emails_opened || 0;
      const clicked = row.emails_clicked || 0;
      
      let score = 0;
      if (received > 0) {
        score += (opened / received) * 50;
        score += (clicked / received) * 50;
      }
      
      return {
        contactId: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        emailsReceived: received,
        emailsOpened: opened,
        emailsClicked: clicked,
        lastEngagement: row.last_engagement ? new Date(row.last_engagement) : undefined,
        engagementScore: Math.round(score)
      };
    });
  }
  
  // ==================== Send Time Analysis ====================
  
  analyzeSendTimes(): { dayOfWeek: number; hour: number; openRate: number; sampleSize: number }[] {
    return this.db.prepare(`
      SELECT 
        CAST(strftime('%w', sent_at) AS INTEGER) as day_of_week,
        CAST(strftime('%H', sent_at) AS INTEGER) as hour,
        AVG(CASE WHEN status IN ('opened', 'clicked') THEN 1.0 ELSE 0.0 END) as open_rate,
        COUNT(*) as sample_size
      FROM email_logs
      WHERE sent_at IS NOT NULL
      GROUP BY day_of_week, hour
      HAVING sample_size >= 5
      ORDER BY open_rate DESC
    `).all() as any[];
  }
  
  // ==================== Real-time Tracking ====================
  
  trackEmailSent(emailLogId: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.recordMetrics({
      date: today,
      emailsSent: 1,
      emailsDelivered: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsBounced: 0,
      emailsFailed: 0,
      responsesReceived: 0,
      positiveResponses: 0,
      negativeResponses: 0
    });
  }
  
  trackEmailOpened(emailLogId: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.recordMetrics({
      date: today,
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 1,
      emailsClicked: 0,
      emailsBounced: 0,
      emailsFailed: 0,
      responsesReceived: 0,
      positiveResponses: 0,
      negativeResponses: 0
    });
  }
  
  trackEmailClicked(emailLogId: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.recordMetrics({
      date: today,
      emailsSent: 0,
      emailsDelivered: 0,
      emailsOpened: 0,
      emailsClicked: 1,
      emailsBounced: 0,
      emailsFailed: 0,
      responsesReceived: 0,
      positiveResponses: 0,
      negativeResponses: 0
    });
  }
  
  // ==================== Dashboard Data ====================
  
  getDashboardSummary(): {
    totalContacts: number;
    emailsSentToday: number;
    emailsSentThisWeek: number;
    openRate: number;
    clickRate: number;
    pendingScheduled: number;
    topEngaged: ContactEngagement[];
  } {
    const totalContacts = (this.db.prepare('SELECT COUNT(*) as count FROM contacts').get() as any).count;
    
    const today = new Date().toISOString().split('T')[0];
    const todayMetrics = this.getMetrics(today);
    const emailsSentToday = todayMetrics?.emailsSent || 0;
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekMetrics = this.getMetricsRange(weekStart.toISOString().split('T')[0], today);
    const emailsSentThisWeek = weekMetrics.reduce((sum, m) => sum + m.emailsSent, 0);
    
    const summary = this.getCampaignSummary(undefined, 30);
    
    const pendingScheduled = (this.db.prepare(`
      SELECT COUNT(*) as count FROM scheduled_emails WHERE status = 'pending'
    `).get() as any).count;
    
    const topEngaged = this.getTopEngagedContacts(5);
    
    return {
      totalContacts,
      emailsSentToday,
      emailsSentThisWeek,
      openRate: summary.openRate,
      clickRate: summary.clickRate,
      pendingScheduled,
      topEngaged
    };
  }
  
  // ==================== Export ====================
  
  exportToCSV(startDate: string, endDate: string): string {
    const metrics = this.getMetricsRange(startDate, endDate);
    
    const headers = [
      'Date', 'Campaign ID', 'Emails Sent', 'Delivered', 'Opened', 
      'Clicked', 'Bounced', 'Failed', 'Open Rate %', 'Click Rate %'
    ].join(',');
    
    const rows = metrics.map(m => {
      const openRate = m.emailsSent > 0 ? ((m.emailsOpened / m.emailsSent) * 100).toFixed(2) : '0';
      const clickRate = m.emailsSent > 0 ? ((m.emailsClicked / m.emailsSent) * 100).toFixed(2) : '0';
      
      return [
        m.date,
        m.campaignId || '',
        m.emailsSent,
        m.emailsDelivered,
        m.emailsOpened,
        m.emailsClicked,
        m.emailsBounced,
        m.emailsFailed,
        openRate,
        clickRate
      ].join(',');
    });
    
    return [headers, ...rows].join('\n');
  }
}
