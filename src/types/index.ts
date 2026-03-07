/**
 * Core types for HR Outreach Automation Engine
 */

export interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  skills: string[];
  experienceYears?: number;
  location?: string;
  source: string;
  status: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'hired' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  notes?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'initial' | 'followup' | 'response' | 'rejection';
  requiredSkills: string[];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  tone: 'formal' | 'casual' | 'enthusiastic';
  placeholders: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  targetSkills: string[];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  dailyLimit: number;
  timezone: string;
  optimalSendWindow: TimeWindow;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeWindow {
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number;
  endMinute: number;
  timezone: string;
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
}

export interface EmailLog {
  id: string;
  campaignId?: string;
  contactId: string;
  templateId?: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bounceReason?: string;
  errorMessage?: string;
  trackingId: string;
  createdAt: Date;
}

export interface ScheduledEmail {
  id: string;
  emailLogId: string;
  contactId: string;
  scheduledAt: Date;
  timezone: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

export interface AnalyticsMetrics {
  date: string;
  campaignId?: string;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  emailsFailed: number;
  responsesReceived: number;
  positiveResponses: number;
  negativeResponses: number;
  avgResponseTimeHours?: number;
}

export interface SendTimeOptimization {
  dayOfWeek: number;
  hour: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  score: number;
}

export interface ContactSearchFilters {
  skills?: string[];
  status?: Contact['status'][];
  priority?: Contact['priority'][];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  location?: string;
  company?: string;
  source?: string;
  lastContactedBefore?: Date;
  lastContactedAfter?: Date;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  trackingId?: string;
}

export interface TemplateMatchResult {
  template: EmailTemplate;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}
