/**
 * Email Log Repository
 * Track email status and history
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { EmailLog } from '../types/index.js';

export class EmailLogRepository {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  private rowToEmailLog(row: any): EmailLog {
    return {
      id: row.id,
      campaignId: row.campaign_id,
      contactId: row.contact_id,
      templateId: row.template_id,
      subject: row.subject,
      body: row.body,
      status: row.status,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      openedAt: row.opened_at ? new Date(row.opened_at) : undefined,
      clickedAt: row.clicked_at ? new Date(row.clicked_at) : undefined,
      bounceReason: row.bounce_reason,
      errorMessage: row.error_message,
      trackingId: row.tracking_id,
      createdAt: new Date(row.created_at)
    };
  }
  
  create(data: Omit<EmailLog, 'id' | 'createdAt'>): EmailLog {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO email_logs (
        id, campaign_id, contact_id, template_id, subject, body,
        status, tracking_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.campaignId || null,
      data.contactId,
      data.templateId || null,
      data.subject,
      data.body,
      data.status,
      data.trackingId,
      now
    );
    
    return this.getById(id)!;
  }
  
  getById(id: string): EmailLog | null {
    const row = this.db.prepare('SELECT * FROM email_logs WHERE id = ?').get(id);
    return row ? this.rowToEmailLog(row) : null;
  }
  
  getByTrackingId(trackingId: string): EmailLog | null {
    const row = this.db.prepare('SELECT * FROM email_logs WHERE tracking_id = ?').get(trackingId);
    return row ? this.rowToEmailLog(row) : null;
  }
  
  findByContact(contactId: string): EmailLog[] {
    const rows = this.db.prepare(`
      SELECT * FROM email_logs 
      WHERE contact_id = ? 
      ORDER BY created_at DESC
    `).all(contactId);
    return rows.map(row => this.rowToEmailLog(row));
  }
  
  findByCampaign(campaignId: string): EmailLog[] {
    const rows = this.db.prepare(`
      SELECT * FROM email_logs 
      WHERE campaign_id = ? 
      ORDER BY created_at DESC
    `).all(campaignId);
    return rows.map(row => this.rowToEmailLog(row));
  }
  
  updateStatus(
    id: string, 
    status: EmailLog['status'], 
    options?: { errorMessage?: string; bounceReason?: string }
  ): boolean {
    let sql = 'UPDATE email_logs SET status = ?';
    const params: any[] = [status];
    
    if (status === 'sent') {
      sql += ', sent_at = ?';
      params.push(new Date().toISOString());
    }
    
    if (status === 'opened' || status === 'clicked') {
      if (status === 'opened') {
        sql += ', opened_at = ?';
        params.push(new Date().toISOString());
      }
      if (status === 'clicked') {
        sql += ', clicked_at = ?';
        params.push(new Date().toISOString());
      }
    }
    
    if (options?.errorMessage) {
      sql += ', error_message = ?';
      params.push(options.errorMessage);
    }
    
    if (options?.bounceReason) {
      sql += ', bounce_reason = ?';
      params.push(options.bounceReason);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return result.changes > 0;
  }
  
  markAsOpened(trackingId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE email_logs 
      SET status = 'opened', opened_at = ?
      WHERE tracking_id = ? AND (opened_at IS NULL OR status != 'opened')
    `);
    const result = stmt.run(new Date().toISOString(), trackingId);
    return result.changes > 0;
  }
  
  markAsClicked(trackingId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE email_logs 
      SET status = 'clicked', clicked_at = ?
      WHERE tracking_id = ?
    `);
    const result = stmt.run(new Date().toISOString(), trackingId);
    return result.changes > 0;
  }
  
  getStats(campaignId?: string): {
    total: number;
    byStatus: Record<string, number>;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  } {
    const whereClause = campaignId ? 'WHERE campaign_id = ?' : '';
    const params = campaignId ? [campaignId] : [];
    
    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM email_logs ${whereClause}`).get(...params) as any;
    const total = totalRow.count;
    
    const statusRows = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM email_logs ${whereClause}
      GROUP BY status
    `).all(...params) as any[];
    
    const byStatus = Object.fromEntries(statusRows.map(r => [r.status, r.count]));
    
    const sent = byStatus['sent'] || 0;
    const opened = byStatus['opened'] || 0;
    const clicked = byStatus['clicked'] || 0;
    const bounced = byStatus['bounced'] || 0;
    
    return {
      total,
      byStatus,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0
    };
  }
}
