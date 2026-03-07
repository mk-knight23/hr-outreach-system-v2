"""
Gmail client wrapper using gws CLI
"""
import subprocess
import json
import shlex
from datetime import datetime, timedelta

class GmailClient:
    """Wrapper for gws CLI Gmail operations"""
    
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        
    def _run_gws_command(self, command):
        """Execute gws CLI command and return result"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                print(f"gws error: {result.stderr}")
                return None
                
            return result.stdout
        except subprocess.TimeoutExpired:
            print("Command timed out")
            return None
        except Exception as e:
            print(f"Error running command: {e}")
            return None
    
    def send_email(self, to_email, subject, body, cc=None, bcc=None):
        """
        Send email using gws CLI
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (plain text)
            cc: CC recipients (comma-separated)
            bcc: BCC recipients (comma-separated)
        
        Returns:
            dict: Result with success status and message ID
        """
        if self.dry_run:
            print(f"[DRY RUN] Would send email to: {to_email}")
            print(f"[DRY RUN] Subject: {subject}")
            print(f"[DRY RUN] Body preview: {body[:100]}...")
            return {"success": True, "dry_run": True}
        
        # Escape special characters for shell
        safe_subject = shlex.quote(subject)
        safe_body = shlex.quote(body)
        safe_to = shlex.quote(to_email)
        
        # Build command
        cmd = f"gws gmail +send --to {safe_to} --subject {safe_subject} --body {safe_body}"
        
        if cc:
            cmd += f" --cc {shlex.quote(cc)}"
        if bcc:
            cmd += f" --bcc {shlex.quote(bcc)}"
        
        print(f"Sending email to {to_email}...")
        output = self._run_gws_command(cmd)
        
        if output:
            print(f"Email sent successfully to {to_email}")
            return {"success": True, "output": output}
        else:
            print(f"Failed to send email to {to_email}")
            return {"success": False, "error": "Command failed"}
    
    def get_sent_emails(self, days_back=7):
        """
        Get list of recently sent emails
        
        Returns:
            list: Recent sent emails
        """
        # Calculate date range
        after_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y/%m/%d")
        
        # Query for sent emails using gws CLI
        cmd = f"gws gmail users.messages.list --params '{{\"labelIds\": [\"SENT\"], \"q\": \"after:{after_date}\"}}' --format json"
        
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                data = json.loads(output)
                return data.get("messages", [])
            except json.JSONDecodeError:
                return []
        return []
    
    def check_for_replies(self, to_email, since_date):
        """
        Check if a recipient has replied to our emails
        
        Args:
            to_email: Email to check replies from
            since_date: Date to check from (ISO format)
        
        Returns:
            bool: True if reply found
        """
        # Query for emails from this recipient
        after_date = datetime.fromisoformat(since_date.replace('Z', '+00:00')).strftime("%Y/%m/%d")
        cmd = f"gws gmail users.messages.list --params '{{\"q\": \"from:{to_email} after:{after_date}\"}}' --format json"
        
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                data = json.loads(output)
                messages = data.get("messages", [])
                return len(messages) > 0
            except json.JSONDecodeError:
                pass
        return False
    
    def get_inbox_summary(self, max_results=10):
        """
        Get unread inbox summary
        
        Returns:
            list: Unread messages
        """
        cmd = f"gws gmail users.messages.list --params '{{\"labelIds\": [\"INBOX\", \"UNREAD\"], \"maxResults\": {max_results}}}' --format json"
        
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                data = json.loads(output)
                return data.get("messages", [])
            except json.JSONDecodeError:
                return []
        return []
    
    def test_connection(self):
        """Test Gmail connection by getting profile"""
        cmd = "gws gmail users.getProfile --format json"
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                profile = json.loads(output)
                print(f"Connected to Gmail: {profile.get('emailAddress')}")
                return True
            except json.JSONDecodeError:
                pass
        print("Failed to connect to Gmail")
        return False
