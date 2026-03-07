/**
 * Contact Database Operations
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Contact, ContactSearchFilters } from '../types/index.js';

export class ContactRepository {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  private rowToContact(row: any): Contact {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      title: row.title,
      linkedinUrl: row.linkedin_url,
      skills: JSON.parse(row.skills),
      experienceYears: row.experience_years,
      location: row.location,
      source: row.source,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
      notes: row.notes
    };
  }
  
  create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        id, email, first_name, last_name, company, title, linkedin_url,
        skills, experience_years, location, source, status, priority,
        created_at, updated_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      contact.email,
      contact.firstName,
      contact.lastName,
      contact.company || null,
      contact.title || null,
      contact.linkedinUrl || null,
      JSON.stringify(contact.skills),
      contact.experienceYears || null,
      contact.location || null,
      contact.source,
      contact.status,
      contact.priority,
      now,
      now,
      contact.notes || null
    );
    
    return this.getById(id)!;
  }
  
  createBatch(contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]): Contact[] {
    const insert = this.db.prepare(`
      INSERT INTO contacts (
        id, email, first_name, last_name, company, title, linkedin_url,
        skills, experience_years, location, source, status, priority,
        created_at, updated_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const created: Contact[] = [];
    const now = new Date().toISOString();
    
    const insertMany = this.db.transaction((items) => {
      for (const contact of items) {
        try {
          const id = randomUUID();
          insert.run(
            id,
            contact.email,
            contact.firstName,
            contact.lastName,
            contact.company || null,
            contact.title || null,
            contact.linkedinUrl || null,
            JSON.stringify(contact.skills),
            contact.experienceYears || null,
            contact.location || null,
            contact.source,
            contact.status,
            contact.priority,
            now,
            now,
            contact.notes || null
          );
          created.push(this.getById(id)!);
        } catch (error) {
          console.error(`Failed to insert contact ${contact.email}:`, error);
        }
      }
    });
    
    insertMany(contacts);
    return created;
  }
  
  getById(id: string): Contact | null {
    const row = this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    return row ? this.rowToContact(row) : null;
  }
  
  getByEmail(email: string): Contact | null {
    const row = this.db.prepare('SELECT * FROM contacts WHERE email = ?').get(email);
    return row ? this.rowToContact(row) : null;
  }
  
  find(filters: ContactSearchFilters, limit = 100, offset = 0): Contact[] {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.skills?.length) {
      conditions.push(`(
        ${filters.skills.map(() => `skills LIKE ?`).join(' OR ')}
      )`);
      filters.skills.forEach(skill => params.push(`%"${skill}"%`));
    }
    
    if (filters.status?.length) {
      conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`);
      params.push(...filters.status);
    }
    
    if (filters.priority?.length) {
      conditions.push(`priority IN (${filters.priority.map(() => '?').join(',')})`);
      params.push(...filters.priority);
    }
    
    if (filters.minExperienceYears !== undefined) {
      conditions.push('experience_years >= ?');
      params.push(filters.minExperienceYears);
    }
    
    if (filters.maxExperienceYears !== undefined) {
      conditions.push('experience_years <= ?');
      params.push(filters.maxExperienceYears);
    }
    
    if (filters.location) {
      conditions.push('location LIKE ?');
      params.push(`%${filters.location}%`);
    }
    
    if (filters.company) {
      conditions.push('company LIKE ?');
      params.push(`%${filters.company}%`);
    }
    
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    
    if (filters.lastContactedBefore) {
      conditions.push('(last_contacted_at IS NULL OR last_contacted_at < ?)');
      params.push(filters.lastContactedBefore.toISOString());
    }
    
    if (filters.lastContactedAfter) {
      conditions.push('last_contacted_at > ?');
      params.push(filters.lastContactedAfter.toISOString());
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const stmt = this.db.prepare(`
      SELECT * FROM contacts ${whereClause}
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(...params, limit, offset);
    return rows.map(row => this.rowToContact(row));
  }
  
  update(id: string, updates: Partial<Omit<Contact, 'id' | 'createdAt'>>): Contact | null {
    const sets: string[] = [];
    const params: any[] = [];
    
    if (updates.email) { sets.push('email = ?'); params.push(updates.email); }
    if (updates.firstName) { sets.push('first_name = ?'); params.push(updates.firstName); }
    if (updates.lastName) { sets.push('last_name = ?'); params.push(updates.lastName); }
    if ('company' in updates) { sets.push('company = ?'); params.push(updates.company); }
    if ('title' in updates) { sets.push('title = ?'); params.push(updates.title); }
    if ('linkedinUrl' in updates) { sets.push('linkedin_url = ?'); params.push(updates.linkedinUrl); }
    if (updates.skills) { sets.push('skills = ?'); params.push(JSON.stringify(updates.skills)); }
    if ('experienceYears' in updates) { sets.push('experience_years = ?'); params.push(updates.experienceYears); }
    if ('location' in updates) { sets.push('location = ?'); params.push(updates.location); }
    if (updates.source) { sets.push('source = ?'); params.push(updates.source); }
    if (updates.status) { sets.push('status = ?'); params.push(updates.status); }
    if (updates.priority) { sets.push('priority = ?'); params.push(updates.priority); }
    if (updates.lastContactedAt) { sets.push('last_contacted_at = ?'); params.push(updates.lastContactedAt.toISOString()); }
    if ('notes' in updates) { sets.push('notes = ?'); params.push(updates.notes); }
    
    sets.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    const stmt = this.db.prepare(`UPDATE contacts SET ${sets.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    return result.changes > 0 ? this.getById(id) : null;
  }
  
  updateStatus(id: string, status: Contact['status']): boolean {
    const stmt = this.db.prepare(`
      UPDATE contacts 
      SET status = ?, updated_at = ?${status === 'contacted' ? ', last_contacted_at = ?' : ''}
      WHERE id = ?
    `);
    const now = new Date().toISOString();
    const result = status === 'contacted' 
      ? stmt.run(status, now, now, id)
      : stmt.run(status, now, id);
    return result.changes > 0;
  }
  
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  count(filters?: ContactSearchFilters): number {
    if (!filters) {
      const row = this.db.prepare('SELECT COUNT(*) as count FROM contacts').get() as any;
      return row.count;
    }
    
    // Reuse find logic with count
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.skills?.length) {
      conditions.push(`(${filters.skills.map(() => `skills LIKE ?`).join(' OR ')})`);
      filters.skills.forEach(skill => params.push(`%"${skill}"%`));
    }
    
    if (filters.status?.length) {
      conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`);
      params.push(...filters.status);
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const row = this.db.prepare(`SELECT COUNT(*) as count FROM contacts ${whereClause}`).get(...params) as any;
    return row.count;
  }
  
  getStats(): { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> } {
    const total = this.count();
    
    const statusRows = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM contacts GROUP BY status
    `).all() as any[];
    
    const priorityRows = this.db.prepare(`
      SELECT priority, COUNT(*) as count FROM contacts GROUP BY priority
    `).all() as any[];
    
    return {
      total,
      byStatus: Object.fromEntries(statusRows.map(r => [r.status, r.count])),
      byPriority: Object.fromEntries(priorityRows.map(r => [r.priority, r.count]))
    };
  }
}
