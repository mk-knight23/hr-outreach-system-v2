"""
Main outreach automation engine
"""
import time
import json
from datetime import datetime, timedelta
from gmail_client import GmailClient
from sheets_tracker import SheetsTracker
from job_scraper import JobScraper
from email_templates import EmailTemplates
from config import Status, MAX_EMAILS_PER_DAY, MAX_EMAILS_PER_HOUR, MIN_DELAY_BETWEEN_EMAILS, FOLLOWUP_DAYS

class OutreachEngine:
    """Main engine for automated HR outreach"""
    
    def __init__(self, spreadsheet_id=None, dry_run=False):
        self.dry_run = dry_run
        self.gmail = GmailClient(dry_run=dry_run)
        self.sheets = SheetsTracker(spreadsheet_id)
        self.scraper = JobScraper()
        self.templates = EmailTemplates()
        
        # Track sent emails in this session
        self.session_emails_sent = 0
        self.session_start = datetime.now()
        
    def initialize(self):
        """Initialize the system - create spreadsheet if needed"""
        if not self.sheets.spreadsheet_id:
            print("Creating new tracking spreadsheet...")
            spreadsheet_id = self.sheets.create_spreadsheet()
            if spreadsheet_id:
                print(f"Spreadsheet created: {spreadsheet_id}")
                return spreadsheet_id
            else:
                print("Failed to create spreadsheet")
                return None
        
        # Test Gmail connection
        if not self.dry_run:
            print("Testing Gmail connection...")
            if not self.gmail.test_connection():
                print("WARNING: Gmail connection failed")
        
        return self.sheets.spreadsheet_id
    
    def can_send_email(self):
        """Check if we can send more emails (rate limiting)"""
        # Check daily limit
        sent_today = len(self.gmail.get_sent_emails(days_back=1))
        if sent_today >= MAX_EMAILS_PER_DAY:
            print(f"Daily limit reached ({MAX_EMAILS_PER_DAY} emails)")
            return False
        
        # Check hourly limit
        sent_hour = len(self.gmail.get_sent_emails(days_back=0.04))  # ~1 hour
        if sent_hour >= MAX_EMAILS_PER_HOUR:
            print(f"Hourly limit reached ({MAX_EMAILS_PER_HOUR} emails)")
            return False
        
        return True
    
    def process_new_leads(self, max_leads=5):
        """
        Process new leads - find and add to tracking
        
        Args:
            max_leads: Maximum new leads to add
        
        Returns:
            int: Number of leads added
        """
        print(f"\n=== Finding New Leads ===")
        
        # Find leads from sources
        raw_leads = self.scraper.find_leads_from_sources()
        print(f"Found {len(raw_leads)} potential leads")
        
        # Filter and validate
        valid_leads = self.scraper.filter_leads(raw_leads)
        print(f"{len(valid_leads)} leads passed validation")
        
        # Check for duplicates and add new ones
        added = 0
        for lead in valid_leads:
            if added >= max_leads:
                break
            
            company = lead.get("company_name", "")
            email = lead.get("hr_email", "")
            
            # Check for duplicates
            if self.sheets.check_duplicate(company, email):
                print(f"Skipping duplicate: {company} ({email})")
                continue
            
            # Add to sheet
            if self.sheets.add_lead(lead):
                print(f"Added lead: {company} - {lead.get('job_title')}")
                added += 1
            else:
                print(f"Failed to add lead: {company}")
        
        print(f"Added {added} new leads")
        return added
    
    def send_outreach_emails(self, max_emails=5):
        """
        Send outreach emails to NEW leads
        
        Args:
            max_emails: Maximum emails to send
        
        Returns:
            int: Number of emails sent
        """
        print(f"\n=== Sending Outreach Emails ===")
        
        # Get NEW leads
        new_leads = self.sheets.get_leads_by_status(Status.NEW)
        print(f"Found {len(new_leads)} NEW leads")
        
        sent = 0
        for lead in new_leads:
            if sent >= max_emails:
                break
            
            if not self.can_send_email():
                print("Rate limit reached, stopping")
                break
            
            # Get email details
            company = lead.get("company_name", "")
            hr_name = lead.get("hr_name", "")
            hr_email = lead.get("hr_email", "")
            job_title = lead.get("job_title", "")
            
            if not hr_email:
                print(f"Skipping {company}: no email")
                continue
            
            # Get template
            subject, body = self.templates.get_template_for_status(
                Status.NEW, company, hr_name, job_title
            )
            
            # Send email
            result = self.gmail.send_email(hr_email, subject, body)
            
            if result.get("success"):
                print(f"✓ Sent to {company} ({hr_email})")
                sent += 1
                self.session_emails_sent += 1
                
                # Update lead status
                self._update_lead_after_send(lead, Status.EMAILED)
                
                # Delay between emails
                if not self.dry_run and sent < max_emails:
                    print(f"Waiting {MIN_DELAY_BETWEEN_EMAILS}s...")
                    time.sleep(MIN_DELAY_BETWEEN_EMAILS)
            else:
                print(f"✗ Failed to send to {company}")
        
        print(f"Sent {sent} outreach emails")
        return sent
    
    def send_followups(self, max_emails=3):
        """
        Send follow-up emails
        
        Args:
            max_emails: Maximum follow-ups to send
        
        Returns:
            int: Number of follow-ups sent
        """
        print(f"\n=== Sending Follow-ups ===")
        
        # Get leads needing follow-up
        followup_leads = self.sheets.get_leads_needing_followup()
        print(f"Found {len(followup_leads)} leads needing follow-up")
        
        sent = 0
        for lead in followup_leads:
            if sent >= max_emails:
                break
            
            if not self.can_send_email():
                print("Rate limit reached, stopping")
                break
            
            # Get details
            company = lead.get("company_name", "")
            hr_name = lead.get("hr_name", "")
            hr_email = lead.get("hr_email", "")
            job_title = lead.get("job_title", "")
            current_status = lead.get("status", "")
            
            # Get follow-up template
            subject, body = self.templates.get_template_for_status(
                current_status, company, hr_name, job_title
            )
            
            if not subject:
                print(f"No template for status {current_status}")
                continue
            
            # Send follow-up
            result = self.gmail.send_email(hr_email, subject, body)
            
            if result.get("success"):
                print(f"✓ Follow-up sent to {company}")
                sent += 1
                
                # Update status
                next_status = self.templates.get_next_status(current_status)
                self._update_lead_after_send(lead, next_status)
                
                if not self.dry_run:
                    time.sleep(MIN_DELAY_BETWEEN_EMAILS)
            else:
                print(f"✗ Failed follow-up to {company}")
        
        print(f"Sent {sent} follow-ups")
        return sent
    
    def check_for_replies(self):
        """
        Check Gmail for replies and update lead status
        
        Returns:
            int: Number of replies found
        """
        print(f"\n=== Checking for Replies ===")
        
        # Get leads that have been emailed
        emailed_leads = (
            self.sheets.get_leads_by_status(Status.EMAILED) +
            self.sheets.get_leads_by_status(Status.FOLLOWUP1) +
            self.sheets.get_leads_by_status(Status.FOLLOWUP2)
        )
        
        replies_found = 0
        for lead in emailed_leads:
            hr_email = lead.get("hr_email", "")
            first_contact = lead.get("first_contact_date", "")
            
            if hr_email and first_contact:
                has_replied = self.gmail.check_for_replies(hr_email, first_contact)
                
                if has_replied:
                    print(f"Reply found from {lead.get('company_name')}")
                    self.sheets.update_lead_status(
                        lead.get("lead_id"), 
                        Status.REPLIED,
                        notes="Reply received"
                    )
                    replies_found += 1
        
        print(f"Found {replies_found} replies")
        return replies_found
    
    def _update_lead_after_send(self, lead, new_status):
        """Update lead after sending email"""
        lead_id = lead.get("lead_id", "")
        
        notes = f"Email sent on {datetime.now().isoformat()}"
        if lead.get("notes"):
            notes = f"{lead.get('notes')}; {notes}"
        
        self.sheets.update_lead_status(lead_id, new_status, notes=notes)
    
    def run_full_cycle(self):
        """Run a full automation cycle"""
        print("=" * 60)
        print("HR OUTREACH AUTOMATION ENGINE v2")
        print(f"Started: {datetime.now().isoformat()}")
        print(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print("=" * 60)
        
        # Initialize
        spreadsheet_id = self.initialize()
        if not spreadsheet_id:
            print("Failed to initialize")
            return False
        
        # Step 1: Find new leads
        new_leads = self.process_new_leads(max_leads=5)
        
        # Step 2: Send outreach emails
        outreach_sent = self.send_outreach_emails(max_emails=5)
        
        # Step 3: Send follow-ups
        followups_sent = self.send_followups(max_emails=3)
        
        # Step 4: Check for replies
        replies = self.check_for_replies()
        
        # Summary
        print("\n" + "=" * 60)
        print("CYCLE SUMMARY")
        print("=" * 60)
        print(f"New leads added: {new_leads}")
        print(f"Outreach emails sent: {outreach_sent}")
        print(f"Follow-ups sent: {followups_sent}")
        print(f"Replies found: {replies}")
        print(f"Total emails this session: {self.session_emails_sent}")
        print(f"Completed: {datetime.now().isoformat()}")
        
        return True
    
    def get_stats(self):
        """Get current statistics"""
        all_leads = self.sheets.get_all_leads()
        
        stats = {
            "total_leads": len(all_leads),
            "by_status": {},
            "emails_sent_today": len(self.gmail.get_sent_emails(days_back=1)),
            "session_emails": self.session_emails_sent
        }
        
        for lead in all_leads:
            status = lead.get("status", "UNKNOWN")
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
        
        return stats
