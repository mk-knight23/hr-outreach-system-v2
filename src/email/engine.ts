/**
 * Email Engine - GWS CLI Integration
 * Sends emails using the gws CLI for Google Workspace integration
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import type { EmailPayload, EmailLog, Contact } from '../types/index.js';

const execAsync = promisify(exec);

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  trackingId: string;
}

export interface GWSConfig {
  // GWS CLI configuration
  profile?: string;
  dryRun?: boolean;
  rateLimitDelayMs?: number;
}

export class EmailEngine {
  private config: GWSConfig;
  private lastSendTime: number = 0;
  
  constructor(config: GWSConfig = {}) {
    this.config = {
      dryRun: false,
      rateLimitDelayMs: 1000, // 1 second between emails
      ...config
    };
  }
  
  /**
   * Send a single email using gws CLI
   */
  async sendEmail(payload: EmailPayload): Promise<SendResult> {
    const trackingId = payload.trackingId || this.generateTrackingId();
    
    // Rate limiting
    await this.applyRateLimit();
    
    try {
      if (this.config.dryRun) {
        console.log(`[DRY RUN] Would send email to ${payload.to}`);
        return {
          success: true,
          trackingId,
          messageId: `dry-run-${trackingId}`
        };
      }
      
      // Build gws CLI command
      const cmd = this.buildGWSCommand(payload);
      
      console.log(`Sending email to ${payload.to}...`);
      const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });
      
      if (stderr) {
        console.warn('GWS CLI warning:', stderr);
      }
      
      // Parse message ID from output if available
      const messageId = this.extractMessageId(stdout);
      
      return {
        success: true,
        trackingId,
        messageId
      };
      
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        trackingId,
        error: error.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Send batch emails with progress tracking
   */
  async sendBatch(
    payloads: EmailPayload[],
    onProgress?: (sent: number, total: number, current: EmailPayload, result: SendResult) => void
  ): Promise<SendResult[]> {
    const results: SendResult[] = [];
    
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const result = await this.sendEmail(payload);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, payloads.length, payload, result);
      }
      
      // Brief pause between emails
      if (i < payloads.length - 1) {
        await this.sleep(this.config.rateLimitDelayMs || 1000);
      }
    }
    
    return results;
  }
  
  /**
   * Build gws gmail send command
   */
  private buildGWSCommand(payload: EmailPayload): string {
    const profile = this.config.profile ? `--profile ${this.config.profile}` : '';
    
    // Escape special characters for shell
    const to = this.escapeShellArg(payload.to);
    const subject = this.escapeShellArg(payload.subject);
    const body = this.escapeShellArg(payload.body);
    
    let cmd = `gws gmail send ${profile} --to ${to} --subject ${subject} --body ${body}`;
    
    if (payload.cc?.length) {
      cmd += ` --cc ${payload.cc.map(c => this.escapeShellArg(c)).join(',')}`;
    }
    
    if (payload.bcc?.length) {
      cmd += ` --bcc ${payload.bcc.map(c => this.escapeShellArg(c)).join(',')}`;
    }
    
    if (payload.replyTo) {
      cmd += ` --reply-to ${this.escapeShellArg(payload.replyTo)}`;
    }
    
    return cmd;
  }
  
  /**
   * Escape string for shell command
   */
  private escapeShellArg(arg: string): string {
    return `"${arg.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`;
  }
  
  /**
   * Extract message ID from gws output
   */
  private extractMessageId(output: string): string | undefined {
    // Look for message ID pattern in output
    const match = output.match(/Message ID:\s*([a-zA-Z0-9_-]+)/i);
    return match?.[1];
  }
  
  /**
   * Generate unique tracking ID
   */
  private generateTrackingId(): string {
    return `trk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Apply rate limiting between sends
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const delay = this.config.rateLimitDelayMs || 1000;
    const timeSinceLastSend = now - this.lastSendTime;
    
    if (timeSinceLastSend < delay) {
      await this.sleep(delay - timeSinceLastSend);
    }
    
    this.lastSendTime = Date.now();
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Verify GWS CLI is available
   */
  async verifyGWS(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync('gws --version', { timeout: 5000 });
      return {
        available: true,
        version: stdout.trim()
      };
    } catch (error: any) {
      return {
        available: false,
        error: error.message || 'GWS CLI not found'
      };
    }
  }
  
  /**
   * Create tracking pixel HTML
   */
  generateTrackingPixel(trackingId: string, baseUrl?: string): string {
    const url = baseUrl || 'https://tracking.example.com';
    return `\n\n<img src="${url}/pixel/${trackingId}" width="1" height="1" alt="" />`;
  }
  
  /**
   * Add tracking links to email body
   */
  addTrackingLinks(body: string, trackingId: string, baseUrl?: string): string {
    const url = baseUrl || 'https://tracking.example.com';
    
    // Replace regular links with tracked links
    return body.replace(
      /href="(https?:\/\/[^"]+)"/g,
      `href="${url}/click/${trackingId}?url=$1"`
    );
  }
}
