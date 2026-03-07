/**
 * Email Scheduler with Optimal Send Time Optimization
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { 
  ScheduledEmail, 
  TimeWindow, 
  SendTimeOptimization,
  Contact 
} from '../types/index.js';

export interface ScheduleOptions {
  timezone?: string;
  priority?: ScheduledEmail['priority'];
  respectOptimalTime?: boolean;
  minDelayMinutes?: number;
}

export class SchedulerEngine {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  private rowToScheduledEmail(row: any): ScheduledEmail {
    return {
      id: row.id,
      emailLogId: row.email_log_id,
      contactId: row.contact_id,
      scheduledAt: new Date(row.scheduled_at),
      timezone: row.timezone,
      priority: row.priority,
      status: row.status,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      createdAt: new Date(row.created_at)
    };
  }
  
  // ==================== CRUD Operations ====================
  
  schedule(
    emailLogId: string,
    contactId: string,
    scheduledAt: Date,
    options: ScheduleOptions = {}
  ): ScheduledEmail {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO scheduled_emails (
        id, email_log_id, contact_id, scheduled_at, timezone,
        priority, status, attempts, max_attempts, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      emailLogId,
      contactId,
      scheduledAt.toISOString(),
      options.timezone || 'America/New_York',
      options.priority || 'medium',
      'pending',
      0,
      3,
      now
    );
    
    return this.getById(id)!;
  }
  
  scheduleBatch(
    items: { emailLogId: string; contactId: string; scheduledAt: Date }[],
    options: ScheduleOptions = {}
  ): ScheduledEmail[] {
    const insert = this.db.prepare(`
      INSERT INTO scheduled_emails (
        id, email_log_id, contact_id, scheduled_at, timezone,
        priority, status, attempts, max_attempts, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const scheduled: ScheduledEmail[] = [];
    const now = new Date().toISOString();
    
    const insertMany = this.db.transaction((batchItems) => {
      for (const item of batchItems) {
        const id = randomUUID();
        insert.run(
          id,
          item.emailLogId,
          item.contactId,
          item.scheduledAt.toISOString(),
          options.timezone || 'America/New_York',
          options.priority || 'medium',
          'pending',
          0,
          3,
          now
        );
        scheduled.push(this.getById(id)!);
      }
    });
    
    insertMany(items);
    return scheduled;
  }
  
  getById(id: string): ScheduledEmail | null {
    const row = this.db.prepare('SELECT * FROM scheduled_emails WHERE id = ?').get(id);
    return row ? this.rowToScheduledEmail(row) : null;
  }
  
  findPending(limit = 100): ScheduledEmail[] {
    const rows = this.db.prepare(`
      SELECT * FROM scheduled_emails 
      WHERE status = 'pending' AND scheduled_at <= ?
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT ?
    `).all(new Date().toISOString(), limit);
    
    return rows.map(row => this.rowToScheduledEmail(row));
  }
  
  findByContact(contactId: string): ScheduledEmail[] {
    const rows = this.db.prepare(`
      SELECT * FROM scheduled_emails 
      WHERE contact_id = ? 
      ORDER BY scheduled_at DESC
    `).all(contactId);
    
    return rows.map(row => this.rowToScheduledEmail(row));
  }
  
  updateStatus(id: string, status: ScheduledEmail['status']): boolean {
    const stmt = this.db.prepare(`
      UPDATE scheduled_emails 
      SET status = ?, attempts = attempts + 1
      WHERE id = ?
    `);
    
    const result = stmt.run(status, id);
    return result.changes > 0;
  }
  
  cancel(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE scheduled_emails SET status = 'cancelled' WHERE id = ? AND status = 'pending'
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM scheduled_emails WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  // ==================== Optimal Send Time ====================
  
  /**
   * Calculate optimal send time for a contact
   */
  calculateOptimalTime(
    contact: Contact,
    window: TimeWindow,
    options: { respectContactTimezone?: boolean } = {}
  ): Date {
    const now = new Date();
    const tz = contact.location ? this.inferTimezone(contact.location) : window.timezone;
    
    // Get best send times from analytics
    const optimalTimes = this.getOptimalSendTimes(5);
    
    // Find the next available optimal slot
    let candidateDate = new Date(now);
    candidateDate.setMinutes(0, 0, 0); // Start at the beginning of the hour
    
    // Look ahead up to 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const checkDate = new Date(candidateDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      const dayOfWeek = checkDate.getDay();
      
      // Check if this day is in allowed days
      if (!window.daysOfWeek.includes(dayOfWeek)) continue;
      
      // Find the best hour for this day
      const dayOptimalHours = optimalTimes
        .filter(t => t.dayOfWeek === dayOfWeek)
        .sort((a, b) => b.score - a.score);
      
      if (dayOptimalHours.length > 0) {
        const bestHour = dayOptimalHours[0].hour;
        
        // Check if within window
        if (bestHour >= window.startHour && bestHour <= window.endHour) {
          checkDate.setHours(bestHour, window.startMinute, 0, 0);
          
          // Make sure it's in the future
          if (checkDate > now) {
            return checkDate;
          }
        }
      }
      
      // Fallback: use window start time
      const fallbackDate = new Date(checkDate);
      fallbackDate.setHours(window.startHour, window.startMinute, 0, 0);
      
      if (fallbackDate > now) {
        return fallbackDate;
      }
    }
    
    // Ultimate fallback: tomorrow at window start
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(window.startHour, window.startMinute, 0, 0);
    return tomorrow;
  }
  
  /**
   * Get optimal send times based on historical data
   */
  getOptimalSendTimes(limit = 10): SendTimeOptimization[] {
    const rows = this.db.prepare(`
      SELECT * FROM send_time_optimization 
      WHERE sample_size > 10
      ORDER BY score DESC
      LIMIT ?
    `).all(limit) as any[];
    
    if (rows.length > 0) {
      return rows.map(row => ({
        dayOfWeek: row.day_of_week,
        hour: row.hour,
        openRate: row.open_rate,
        clickRate: row.click_rate,
        responseRate: row.response_rate,
        score: row.score
      }));
    }
    
    // Default optimal times if no data yet
    return this.getDefaultOptimalTimes();
  }
  
  /**
   * Default optimal send times based on industry research
   */
  private getDefaultOptimalTimes(): SendTimeOptimization[] {
    // Tuesday-Thursday, 9am-11am and 2pm-4pm
    const defaults: SendTimeOptimization[] = [];
    
    for (const day of [2, 3, 4]) { // Tue, Wed, Thu
      for (const hour of [9, 10, 14, 15]) {
        defaults.push({
          dayOfWeek: day,
          hour,
          openRate: 0.25,
          clickRate: 0.05,
          responseRate: 0.03,
          score: 1.0
        });
      }
    }
    
    return defaults.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Update send time optimization data
   */
  updateOptimalTime(data: SendTimeOptimization & { sampleSize: number }): void {
    const stmt = this.db.prepare(`
      INSERT INTO send_time_optimization (
        id, day_of_week, hour, open_rate, click_rate, response_rate, score, sample_size, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(day_of_week, hour) DO UPDATE SET
        open_rate = excluded.open_rate,
        click_rate = excluded.click_rate,
        response_rate = excluded.response_rate,
        score = excluded.score,
        sample_size = excluded.sample_size,
        updated_at = excluded.updated_at
    `);
    
    stmt.run(
      randomUUID(),
      data.dayOfWeek,
      data.hour,
      data.openRate,
      data.clickRate,
      data.responseRate,
      data.score,
      data.sampleSize,
      new Date().toISOString()
    );
  }
  
  /**
   * Infer timezone from location string
   */
  private inferTimezone(location: string): string {
    const locationLower = location.toLowerCase();
    
    // US timezones
    if (locationLower.includes('new york') || locationLower.includes('boston') || 
        locationLower.includes('miami') || locationLower.includes('atlanta')) {
      return 'America/New_York';
    }
    if (locationLower.includes('chicago') || locationLower.includes('dallas') || 
        locationLower.includes('houston') || locationLower.includes('austin')) {
      return 'America/Chicago';
    }
    if (locationLower.includes('denver') || locationLower.includes('phoenix') || 
        locationLower.includes('salt lake')) {
      return 'America/Denver';
    }
    if (locationLower.includes('san francisco') || locationLower.includes('los angeles') || 
        locationLower.includes('seattle') || locationLower.includes('portland') ||
        locationLower.includes('san diego') || locationLower.includes('las vegas')) {
      return 'America/Los_Angeles';
    }
    
    // International
    if (locationLower.includes('london') || locationLower.includes('uk')) {
      return 'Europe/London';
    }
    if (locationLower.includes('berlin') || locationLower.includes('paris') || 
        locationLower.includes('amsterdam')) {
      return 'Europe/Berlin';
    }
    if (locationLower.includes('bangalore') || locationLower.includes('mumbai') || 
        locationLower.includes('delhi') || locationLower.includes('india')) {
      return 'Asia/Kolkata';
    }
    if (locationLower.includes('singapore')) {
      return 'Asia/Singapore';
    }
    if (locationLower.includes('sydney') || locationLower.includes('melbourne')) {
      return 'Australia/Sydney';
    }
    if (locationLower.includes('tokyo')) {
      return 'Asia/Tokyo';
    }
    
    return 'America/New_York'; // Default
  }
  
  /**
   * Create a default time window
   */
  static createDefaultTimeWindow(timezone = 'America/New_York'): TimeWindow {
    return {
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      timezone,
      daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
    };
  }
  
  /**
   * Stagger schedules to avoid sending too many at once
   */
  staggerSchedules(
    baseTime: Date,
    count: number,
    staggerMinutes = 5
  ): Date[] {
    const times: Date[] = [];
    
    for (let i = 0; i < count; i++) {
      const time = new Date(baseTime);
      time.setMinutes(time.getMinutes() + (i * staggerMinutes));
      times.push(time);
    }
    
    return times;
  }
  
  /**
   * Get pending count
   */
  getPendingCount(): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM scheduled_emails WHERE status = 'pending'
    `).get() as any;
    return row.count;
  }
  
  /**
   * Get today's scheduled count
   */
  getTodayScheduledCount(): number {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM scheduled_emails 
      WHERE scheduled_at BETWEEN ? AND ?
    `).get(startOfDay.toISOString(), endOfDay.toISOString()) as any;
    
    return row.count;
  }
}
