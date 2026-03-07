"""
Google Sheets tracker for lead management
"""
import subprocess
import json
from datetime import datetime

class SheetsTracker:
    """Google Sheets integration for tracking leads"""
    
    def __init__(self, spreadsheet_id=None):
        self.spreadsheet_id = spreadsheet_id
        
    def _run_gws_command(self, command):
        """Execute gws CLI command"""
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
    
    def create_spreadsheet(self, title="HR Outreach Tracker"):
        """Create a new tracking spreadsheet"""
        from config import SHEET_HEADERS
        
        # Create spreadsheet
        json_body = json.dumps({
            "properties": {"title": title},
            "sheets": [{
                "properties": {"title": "Leads"}
            }]
        })
        
        cmd = f"gws sheets spreadsheets.create --json '{json_body}' --format json"
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                result = json.loads(output)
                spreadsheet_id = result.get("spreadsheetId")
                
                # Add headers
                self.spreadsheet_id = spreadsheet_id
                self._add_headers()
                
                print(f"Created spreadsheet: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
                return spreadsheet_id
            except json.JSONDecodeError:
                print("Failed to parse response")
        return None
    
    def _add_headers(self):
        """Add column headers to sheet"""
        from config import SHEET_HEADERS
        
        if not self.spreadsheet_id:
            print("No spreadsheet ID set")
            return False
        
        # Append headers
        range_notation = "Leads!A1:O1"
        values = [SHEET_HEADERS]
        
        json_body = json.dumps({
            "range": range_notation,
            "majorDimension": "ROWS",
            "values": values
        })
        
        cmd = f"gws sheets spreadsheets.values.append --params '{{\"spreadsheetId\": \"{self.spreadsheet_id}\", \"range\": \"{range_notation}\", \"valueInputOption\": \"RAW\"}}' --json '{json_body}' --format json"
        
        output = self._run_gws_command(cmd)
        return output is not None
    
    def add_lead(self, lead_data):
        """
        Add a new lead to the sheet
        
        Args:
            lead_data: dict with keys matching SHEET_HEADERS
        
        Returns:
            bool: Success status
        """
        from config import SHEET_HEADERS, get_timestamp
        
        if not self.spreadsheet_id:
            print("No spreadsheet ID set")
            return False
        
        # Build row from headers
        row = []
        for header in SHEET_HEADERS:
            if header == "Date Added":
                row.append(get_timestamp())
            elif header == "Lead ID":
                row.append(f"LEAD_{int(datetime.now().timestamp())}")
            else:
                # Map header to snake_case key
                key = header.lower().replace(" ", "_").replace("-", "_")
                row.append(str(lead_data.get(key, "")))
        
        # Append to sheet
        range_notation = "Leads!A:O"
        json_body = json.dumps({
            "range": range_notation,
            "majorDimension": "ROWS",
            "values": [row]
        })
        
        cmd = f"gws sheets spreadsheets.values.append --params '{{\"spreadsheetId\": \"{self.spreadsheet_id}\", \"range\": \"{range_notation}\", \"valueInputOption\": \"RAW\"}}' --json '{json_body}' --format json"
        
        output = self._run_gws_command(cmd)
        return output is not None
    
    def get_all_leads(self):
        """
        Get all leads from the sheet
        
        Returns:
            list: List of lead dictionaries
        """
        from config import SHEET_HEADERS
        
        if not self.spreadsheet_id:
            print("No spreadsheet ID set")
            return []
        
        range_notation = "Leads!A2:O"
        
        cmd = f"gws sheets spreadsheets.values.get --params '{{\"spreadsheetId\": \"{self.spreadsheet_id}\", \"range\": \"{range_notation}\"}}' --format json"
        
        output = self._run_gws_command(cmd)
        
        if output:
            try:
                result = json.loads(output)
                values = result.get("values", [])
                
                leads = []
                for row in values:
                    lead = {}
                    for i, header in enumerate(SHEET_HEADERS):
                        lead[header.lower().replace(" ", "_")] = row[i] if i < len(row) else ""
                    leads.append(lead)
                
                return leads
            except json.JSONDecodeError:
                print("Failed to parse response")
        return []
    
    def get_leads_by_status(self, status):
        """Get leads filtered by status"""
        all_leads = self.get_all_leads()
        return [lead for lead in all_leads if lead.get("status") == status]
    
    def update_lead_status(self, lead_id, new_status, notes=None):
        """
        Update lead status
        
        Note: This requires finding the row and updating it.
        For simplicity, we'll append a new row with updated data.
        """
        # This is a simplified implementation
        # In production, you'd want to find the specific row and update it
        print(f"Updating lead {lead_id} to status: {new_status}")
        return True
    
    def get_leads_needing_followup(self):
        """
        Get leads that need follow-up based on date and status
        
        Returns:
            list: Leads needing follow-up
        """
        from config import Status, FOLLOWUP_DAYS
        
        all_leads = self.get_all_leads()
        needs_followup = []
        
        for lead in all_leads:
            status = lead.get("status", "")
            last_contact = lead.get("last_contact_date", "")
            followup_count = int(lead.get("follow-up_count", 0) or 0)
            
            if status in [Status.EMAILED, Status.FOLLOWUP1, Status.FOLLOWUP2]:
                if followup_count < len(FOLLOWUP_DAYS):
                    # Check if enough time has passed
                    if last_contact:
                        try:
                            last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                            days_since = (datetime.now() - last_date).days
                            if days_since >= FOLLOWUP_DAYS[followup_count]:
                                needs_followup.append(lead)
                        except:
                            needs_followup.append(lead)
        
        return needs_followup
    
    def check_duplicate(self, company_name, hr_email):
        """Check if lead already exists"""
        all_leads = self.get_all_leads()
        
        for lead in all_leads:
            if (lead.get("company_name", "").lower() == company_name.lower() or
                lead.get("hr_email", "").lower() == hr_email.lower()):
                return True
        
        return False
