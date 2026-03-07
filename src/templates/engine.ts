/**
 * Dynamic Email Templates with Skill Matching
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { 
  EmailTemplate, 
  Contact, 
  TemplateMatchResult,
  EmailPayload 
} from '../types/index.js';

export interface TemplateVariables {
  contact: Contact;
  senderName?: string;
  senderTitle?: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  customFields?: Record<string, string>;
}

export class TemplateEngine {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  private rowToTemplate(row: any): EmailTemplate {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      type: row.type,
      requiredSkills: JSON.parse(row.required_skills),
      minExperienceYears: row.min_experience_years,
      maxExperienceYears: row.max_experience_years,
      tone: row.tone,
      placeholders: JSON.parse(row.placeholders),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  // ==================== CRUD Operations ====================
  
  create(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO email_templates (
        id, name, subject, body, type, required_skills,
        min_experience_years, max_experience_years, tone, placeholders,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      template.name,
      template.subject,
      template.body,
      template.type,
      JSON.stringify(template.requiredSkills),
      template.minExperienceYears || null,
      template.maxExperienceYears || null,
      template.tone,
      JSON.stringify(template.placeholders),
      now,
      now
    );
    
    return this.getById(id)!;
  }
  
  getById(id: string): EmailTemplate | null {
    const row = this.db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
    return row ? this.rowToTemplate(row) : null;
  }
  
  getByName(name: string): EmailTemplate | null {
    const row = this.db.prepare('SELECT * FROM email_templates WHERE name = ?').get(name);
    return row ? this.rowToTemplate(row) : null;
  }
  
  findAll(type?: EmailTemplate['type']): EmailTemplate[] {
    const whereClause = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];
    
    const rows = this.db.prepare(`
      SELECT * FROM email_templates ${whereClause} ORDER BY name
    `).all(...params);
    
    return rows.map(row => this.rowToTemplate(row));
  }
  
  update(id: string, updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>): EmailTemplate | null {
    const sets: string[] = [];
    const params: any[] = [];
    
    if (updates.name) { sets.push('name = ?'); params.push(updates.name); }
    if (updates.subject) { sets.push('subject = ?'); params.push(updates.subject); }
    if (updates.body) { sets.push('body = ?'); params.push(updates.body); }
    if (updates.type) { sets.push('type = ?'); params.push(updates.type); }
    if (updates.requiredSkills) { sets.push('required_skills = ?'); params.push(JSON.stringify(updates.requiredSkills)); }
    if ('minExperienceYears' in updates) { sets.push('min_experience_years = ?'); params.push(updates.minExperienceYears); }
    if ('maxExperienceYears' in updates) { sets.push('max_experience_years = ?'); params.push(updates.maxExperienceYears); }
    if (updates.tone) { sets.push('tone = ?'); params.push(updates.tone); }
    if (updates.placeholders) { sets.push('placeholders = ?'); params.push(JSON.stringify(updates.placeholders)); }
    
    sets.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    const stmt = this.db.prepare(`UPDATE email_templates SET ${sets.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    return result.changes > 0 ? this.getById(id) : null;
  }
  
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM email_templates WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  // ==================== Skill Matching ====================
  
  /**
   * Find the best matching templates for a contact based on skills
   */
  findBestMatches(contact: Contact, limit = 3): TemplateMatchResult[] {
    const templates = this.findAll('initial');
    
    const matches: TemplateMatchResult[] = templates.map(template => {
      const contactSkills = new Set(contact.skills.map(s => s.toLowerCase()));
      const requiredSkills = template.requiredSkills.map(s => s.toLowerCase());
      
      const matchedSkills = requiredSkills.filter(s => contactSkills.has(s));
      const missingSkills = requiredSkills.filter(s => !contactSkills.has(s));
      
      // Calculate match score
      let score = matchedSkills.length / Math.max(requiredSkills.length, 1);
      
      // Experience bonus/penalty
      if (template.minExperienceYears && contact.experienceYears) {
        if (contact.experienceYears >= template.minExperienceYears) {
          score += 0.1;
        } else {
          score -= 0.2;
        }
      }
      
      if (template.maxExperienceYears && contact.experienceYears) {
        if (contact.experienceYears <= template.maxExperienceYears) {
          score += 0.05;
        } else {
          score -= 0.1;
        }
      }
      
      return {
        template,
        matchScore: Math.max(0, Math.min(1, score)),
        matchedSkills,
        missingSkills
      };
    });
    
    // Sort by score descending
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }
  
  /**
   * Get the single best template for a contact
   */
  getBestTemplate(contact: Contact): EmailTemplate | null {
    const matches = this.findBestMatches(contact, 1);
    return matches.length > 0 ? matches[0].template : null;
  }
  
  /**
   * Check if a template matches a contact's criteria
   */
  matchesContact(template: EmailTemplate, contact: Contact): boolean {
    const contactSkills = new Set(contact.skills.map(s => s.toLowerCase()));
    const requiredSkills = template.requiredSkills.map(s => s.toLowerCase());
    
    // Check if contact has all required skills (or at least 50%)
    const matchedCount = requiredSkills.filter(s => contactSkills.has(s)).length;
    const skillMatch = requiredSkills.length === 0 || 
                      matchedCount >= Math.ceil(requiredSkills.length * 0.5);
    
    // Check experience
    let experienceMatch = true;
    if (template.minExperienceYears && contact.experienceYears) {
      experienceMatch = contact.experienceYears >= template.minExperienceYears;
    }
    if (template.maxExperienceYears && contact.experienceYears) {
      experienceMatch = experienceMatch && contact.experienceYears <= template.maxExperienceYears;
    }
    
    return skillMatch && experienceMatch;
  }
  
  // ==================== Template Rendering ====================
  
  /**
   * Render a template with contact variables
   */
  render(template: EmailTemplate, variables: TemplateVariables): EmailPayload {
    const subject = this.renderString(template.subject, variables);
    const body = this.renderString(template.body, variables);
    
    return {
      to: variables.contact.email,
      subject,
      body
    };
  }
  
  /**
   * Render a string with template variables
   */
  private renderString(template: string, variables: TemplateVariables): string {
    const { contact, customFields = {} } = variables;
    
    // Build variable map
    const vars: Record<string, string | number | undefined> = {
      // Contact fields
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      location: contact.location,
      experienceYears: contact.experienceYears,
      skills: contact.skills.join(', '),
      
      // Sender fields
      senderName: variables.senderName,
      senderTitle: variables.senderTitle,
      
      // Job fields
      companyName: variables.companyName,
      jobTitle: variables.jobTitle,
      jobDescription: variables.jobDescription,
      
      // Custom fields
      ...customFields
    };
    
    // Replace {{variable}} placeholders
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = vars[key];
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get available placeholder variables
   */
  getAvailablePlaceholders(): { key: string; description: string }[] {
    return [
      { key: 'firstName', description: "Contact's first name" },
      { key: 'lastName', description: "Contact's last name" },
      { key: 'fullName', description: "Contact's full name" },
      { key: 'email', description: "Contact's email address" },
      { key: 'company', description: "Contact's current company" },
      { key: 'title', description: "Contact's job title" },
      { key: 'location', description: "Contact's location" },
      { key: 'experienceYears', description: "Years of experience" },
      { key: 'skills', description: "Comma-separated list of skills" },
      { key: 'senderName', description: "Your name" },
      { key: 'senderTitle', description: "Your job title" },
      { key: 'companyName', description: "Hiring company name" },
      { key: 'jobTitle', description: "Position being hired for" },
      { key: 'jobDescription', description: "Job description" }
    ];
  }
  
  // ==================== Default Templates ====================
  
  /**
   * Create default email templates
   */
  createDefaultTemplates(): EmailTemplate[] {
    const defaults = [
      {
        name: 'Senior Software Engineer - AI/ML',
        subject: 'Exciting AI Engineering Opportunity at {{companyName}}',
        body: `Hi {{firstName}},

I hope this message finds you well. I'm reaching out because I came across your profile and was impressed by your {{experienceYears}}+ years of experience in {{skills}}.

I'm currently helping {{companyName}} hire for a {{jobTitle}} role. Given your background, I believe you'd be a great fit for this position.

Key highlights:
• Cutting-edge AI/ML projects
• Competitive compensation
• Collaborative, innovative team

Would you be open to a brief conversation about this opportunity?

Best regards,
{{senderName}}
{{senderTitle}}`,
        type: 'initial' as const,
        requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch'],
        minExperienceYears: 5,
        tone: 'formal' as const,
        placeholders: ['firstName', 'experienceYears', 'skills', 'companyName', 'jobTitle', 'senderName', 'senderTitle']
      },
      {
        name: 'Full Stack Developer - Startup',
        subject: '{{companyName}} is hiring Full Stack Engineers!',
        body: `Hey {{firstName}},

I noticed your experience with {{skills}} and thought you'd be perfect for a role at {{companyName}}.

We're building something exciting and looking for talented engineers like you to join our growing team.

The role: {{jobTitle}}

Interested in learning more? Let's chat!

Cheers,
{{senderName}}`,
        type: 'initial' as const,
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        minExperienceYears: 3,
        maxExperienceYears: 8,
        tone: 'casual' as const,
        placeholders: ['firstName', 'skills', 'companyName', 'jobTitle', 'senderName']
      },
      {
        name: 'Generic Follow-up',
        subject: 'Re: {{jobTitle}} Opportunity',
        body: `Hi {{firstName}},

Just wanted to follow up on my previous message about the {{jobTitle}} role at {{companyName}}.

I understand you may be busy, but I'd love to connect when you have a moment.

Let me know if you're interested!

Best,
{{senderName}}`,
        type: 'followup' as const,
        requiredSkills: [],
        tone: 'formal' as const,
        placeholders: ['firstName', 'jobTitle', 'companyName', 'senderName']
      }
    ];
    
    return defaults.map(t => this.create(t));
  }
}
