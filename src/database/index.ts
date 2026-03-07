import { Database } from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.DB_PATH || './database/contacts.db';

export interface Contact {
  id?: number;
  name: string;
  email: string;
  company: string;
  role: string;
  jobUrl?: string;
  jobTitle?: string;
  jobRequirements?: string;
  source: string;
  status: 'new' | 'contacted' | 'replied' | 'interview' | 'rejected';
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  emailSentCount: number;
}

export interface EmailSent {
  id?: number;
  contactId: number;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'bounced';
  gmailMessageId?: string;
  followUpNumber: number;
}

export interface Reply {
  id?: number;
  contactId: number;
  subject: string;
  body: string;
  receivedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

class DatabaseManager {
  private db: Database;

  constructor() {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(DB_PATH);
  }

  async initialize(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Contacts table
    await run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        job_url TEXT,
        job_title TEXT,
        job_requirements TEXT,
        source TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        priority INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_contact_at DATETIME,
        email_sent_count INTEGER DEFAULT 0
      )
    `);

    // Emails sent table
    await run(`
      CREATE TABLE IF NOT EXISTS emails_sent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        gmail_message_id TEXT,
        follow_up_number INTEGER DEFAULT 0,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )
    `);

    // Replies table
    await run(`
      CREATE TABLE IF NOT EXISTS replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sentiment TEXT,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )
    `);

    // Analytics table
    await run(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE DEFAULT CURRENT_DATE,
        emails_sent INTEGER DEFAULT 0,
        emails_failed INTEGER DEFAULT 0,
        replies_received INTEGER DEFAULT 0,
        new_contacts INTEGER DEFAULT 0
      )
    `);

    console.log('✅ Database initialized');
  }

  async addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'emailSentCount'>): Promise<number> {
    const run = promisify(this.db.run.bind(this.db));
    const result = await run(
      `INSERT INTO contacts (name, email, company, role, job_url, job_title, job_requirements, source, status, priority, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [contact.name, contact.email, contact.company, contact.role, contact.jobUrl, contact.jobTitle, contact.jobRequirements, contact.source, contact.status, contact.priority]
    );
    return (result as any).lastID;
  }

  async getContactsToEmail(limit: number = 10): Promise<Contact[]> {
    const all = promisify(this.db.all.bind(this.db));
    return all(
      `SELECT * FROM contacts 
       WHERE status = 'new' 
       AND (last_contact_at IS NULL OR datetime(last_contact_at) < datetime('now', '-1 day'))
       ORDER BY priority DESC, created_at ASC
       LIMIT ?`,
      [limit]
    ) as Promise<Contact[]>;
  }

  async getContactsForFollowUp(days: number, limit: number = 10): Promise<Contact[]> {
    const all = promisify(this.db.all.bind(this.db));
    return all(
      `SELECT c.* FROM contacts c
       JOIN emails_sent es ON c.id = es.contact_id
       WHERE c.status = 'contacted'
       AND es.follow_up_number = ?
       AND datetime(es.sent_at) < datetime('now', '-${days} days')
       AND NOT EXISTS (
         SELECT 1 FROM emails_sent es2 
         WHERE es2.contact_id = c.id 
         AND es2.follow_up_number > ?
       )
       ORDER BY es.sent_at ASC
       LIMIT ?`,
      [days === 3 ? 0 : days === 7 ? 1 : 2, days === 3 ? 0 : days === 7 ? 1 : 2, limit]
    ) as Promise<Contact[]>;
  }

  async updateContactStatus(id: number, status: Contact['status']): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP, last_contact_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );
  }

  async incrementEmailCount(id: number): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `UPDATE contacts SET email_sent_count = email_sent_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  async recordEmailSent(email: Omit<EmailSent, 'id' | 'sentAt'>): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `INSERT INTO emails_sent (contact_id, subject, body, status, gmail_message_id, follow_up_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email.contactId, email.subject, email.body, email.status, email.gmailMessageId, email.followUpNumber]
    );
  }

  async recordReply(reply: Omit<Reply, 'id' | 'receivedAt'>): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `INSERT INTO replies (contact_id, subject, body, sentiment)
       VALUES (?, ?, ?, ?)`,
      [reply.contactId, reply.subject, reply.body, reply.sentiment]
    );
  }

  async getStats(): Promise<{ total: number; contacted: number; replied: number; interview: number }> {
    const all = promisify(this.db.all.bind(this.db));
    const results = await all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status != 'new' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied,
        SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview
      FROM contacts
    `) as any[];
    return results[0];
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export const db = new DatabaseManager();
