/**
 * Database initialization and schema management
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(process.cwd(), 'data', 'hr_outreach.db');

// Schema definitions
const SCHEMA = {
  contacts: `
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      company TEXT,
      title TEXT,
      linkedin_url TEXT,
      skills TEXT NOT NULL DEFAULT '[]',
      experience_years INTEGER,
      location TEXT,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'responded', 'interested', 'not_interested', 'hired', 'archived')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_contacted_at TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(priority);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
  `,
  
  email_templates: `
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('initial', 'followup', 'response', 'rejection')),
      required_skills TEXT NOT NULL DEFAULT '[]',
      min_experience_years INTEGER,
      max_experience_years INTEGER,
      tone TEXT NOT NULL DEFAULT 'formal' CHECK(tone IN ('formal', 'casual', 'enthusiastic')),
      placeholders TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  email_campaigns: `
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      template_id TEXT NOT NULL,
      target_skills TEXT NOT NULL DEFAULT '[]',
      min_experience_years INTEGER,
      max_experience_years INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'running', 'paused', 'completed')),
      scheduled_start_date TEXT,
      scheduled_end_date TEXT,
      daily_limit INTEGER NOT NULL DEFAULT 50,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      optimal_send_window TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES email_templates(id)
    );
  `,
  
  email_logs: `
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      contact_id TEXT NOT NULL,
      template_id TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
      sent_at TEXT,
      opened_at TEXT,
      clicked_at TEXT,
      bounce_reason TEXT,
      error_message TEXT,
      tracking_id TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id),
      FOREIGN KEY (template_id) REFERENCES email_templates(id)
    );
    CREATE INDEX IF NOT EXISTS idx_email_logs_contact ON email_logs(contact_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
    CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON email_logs(tracking_id);
  `,
  
  scheduled_emails: `
    CREATE TABLE IF NOT EXISTS scheduled_emails (
      id TEXT PRIMARY KEY,
      email_log_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email_log_id) REFERENCES email_logs(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );
    CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
  `,
  
  analytics: `
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      campaign_id TEXT,
      emails_sent INTEGER NOT NULL DEFAULT 0,
      emails_delivered INTEGER NOT NULL DEFAULT 0,
      emails_opened INTEGER NOT NULL DEFAULT 0,
      emails_clicked INTEGER NOT NULL DEFAULT 0,
      emails_bounced INTEGER NOT NULL DEFAULT 0,
      emails_failed INTEGER NOT NULL DEFAULT 0,
      responses_received INTEGER NOT NULL DEFAULT 0,
      positive_responses INTEGER NOT NULL DEFAULT 0,
      negative_responses INTEGER NOT NULL DEFAULT 0,
      avg_response_time_hours REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id),
      UNIQUE(date, campaign_id)
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
    CREATE INDEX IF NOT EXISTS idx_analytics_campaign ON analytics(campaign_id);
  `,
  
  send_time_optimization: `
    CREATE TABLE IF NOT EXISTS send_time_optimization (
      id TEXT PRIMARY KEY,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      hour INTEGER NOT NULL CHECK(hour BETWEEN 0 AND 23),
      open_rate REAL NOT NULL DEFAULT 0,
      click_rate REAL NOT NULL DEFAULT 0,
      response_rate REAL NOT NULL DEFAULT 0,
      score REAL NOT NULL DEFAULT 0,
      sample_size INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(day_of_week, hour)
    );
  `
};

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export function initializeDatabase(): Database.Database {
  const db = getDatabase();
  
  // Execute all schema definitions
  Object.entries(SCHEMA).forEach(([tableName, sql]) => {
    try {
      db.exec(sql);
      console.log(`✓ Table '${tableName}' initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize '${tableName}':`, error);
      throw error;
    }
  });
  
  console.log('\n✓ Database initialized successfully at:', DB_PATH);
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('Database connection closed');
  }
}

// For direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}
