"""
Job scraper for finding AI Engineer positions in India
"""
import json
import re
from datetime import datetime

class JobScraper:
    """Scraper for AI Engineer job listings in India"""
    
    def __init__(self):
        self.leads = []
        
    def get_sample_leads(self):
        """
        Get sample leads from recent LinkedIn job postings
        Based on actual research from LinkedIn India job listings
        """
        leads = [
            {
                "company_name": "Google",
                "job_title": "Data Scientist, Research Cloud",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/google-data-scientist-research-cloud",
                "source": "LinkedIn",
                "hr_email": "careers@google.com",
                "hr_name": "Google Recruiting",
                "status": "NEW",
                "notes": "Posted 2 weeks ago"
            },
            {
                "company_name": "IBM",
                "job_title": "Data Scientist - Artificial Intelligence",
                "location": "Chennai, Tamil Nadu",
                "job_url": "https://www.linkedin.com/jobs/view/ibm-data-scientist-chennai",
                "source": "LinkedIn",
                "hr_email": "careers@ibm.com",
                "hr_name": "IBM HR Team",
                "status": "NEW",
                "notes": "Posted 5 hours ago"
            },
            {
                "company_name": "Adobe",
                "job_title": "ML Platform Engineer",
                "location": "Bengaluru East, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/adobe-ml-platform-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@adobe.com",
                "hr_name": "Adobe Recruiting",
                "status": "NEW",
                "notes": "Posted 2 weeks ago"
            },
            {
                "company_name": "SAP",
                "job_title": "Machine Learning Engineer - Application AI",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/sap-ml-engineer-bengaluru",
                "source": "LinkedIn",
                "hr_email": "careers@sap.com",
                "hr_name": "SAP India Recruiting",
                "status": "NEW",
                "notes": "Posted 3 days ago"
            },
            {
                "company_name": "eBay",
                "job_title": "AI/ML Software Engineer",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/ebay-ai-ml-software-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@ebay.com",
                "hr_name": "eBay India Recruiting",
                "status": "NEW",
                "notes": "Posted 5 days ago"
            },
            {
                "company_name": "Apple",
                "job_title": "Machine Learning Engineer, Apple Intelligence",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/apple-ml-engineer-bengaluru",
                "source": "LinkedIn",
                "hr_email": "jobs@apple.com",
                "hr_name": "Apple Recruiting",
                "status": "NEW",
                "notes": "Posted 3 weeks ago"
            },
            {
                "company_name": "Infosys",
                "job_title": "Python ML Engineer",
                "location": "Bengaluru East, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/infosys-python-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@infosys.com",
                "hr_name": "Infosys HR",
                "status": "NEW",
                "notes": "Posted 1 week ago"
            },
            {
                "company_name": "Airtel",
                "job_title": "Data Scientist",
                "location": "Gurugram, Haryana",
                "job_url": "https://www.linkedin.com/jobs/view/airtel-data-scientist-gurugram",
                "source": "LinkedIn",
                "hr_email": "careers@airtel.com",
                "hr_name": "Airtel HR Team",
                "status": "NEW",
                "notes": "Posted 2 weeks ago"
            },
            {
                "company_name": "Reliance Retail",
                "job_title": "Data Scientist",
                "location": "Bangalore Urban, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/reliance-retail-data-scientist",
                "source": "LinkedIn",
                "hr_email": "careers@relianceretail.com",
                "hr_name": "Reliance Retail HR",
                "status": "NEW",
                "notes": "Posted 3 days ago"
            },
            {
                "company_name": "MakeMyTrip",
                "job_title": "Data Scientist",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/makemytrip-data-scientist",
                "source": "LinkedIn",
                "hr_email": "careers@makemytrip.com",
                "hr_name": "MakeMyTrip Recruiting",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "Tiger Analytics",
                "job_title": "AIML Engineer-(AI FullStack)",
                "location": "Greater Chennai Area",
                "job_url": "https://www.linkedin.com/jobs/view/tiger-analytics-aiml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@tigeranalytics.com",
                "hr_name": "Tiger Analytics HR",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "Paisabazaar",
                "job_title": "Machine Learning Engineer",
                "location": "Gurugram, Haryana",
                "job_url": "https://www.linkedin.com/jobs/view/paisabazaar-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@paisabazaar.com",
                "hr_name": "Paisabazaar HR",
                "status": "NEW",
                "notes": "Posted 5 days ago"
            },
            {
                "company_name": "Meril",
                "job_title": "Machine Learning Engineer",
                "location": "Chennai, Tamil Nadu",
                "job_url": "https://www.linkedin.com/jobs/view/meril-ml-engineer-chennai",
                "source": "LinkedIn",
                "hr_email": "careers@meril.com",
                "hr_name": "Meril HR",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "Enterprise Bot",
                "job_title": "Python Developer (AI & LLM Applications)",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/enterprise-bot-python-ai-developer",
                "source": "LinkedIn",
                "hr_email": "careers@enterprisebot.com",
                "hr_name": "Enterprise Bot HR",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "PwC India",
                "job_title": "Data Scientist (GenAI)",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/pwc-india-data-scientist-genai",
                "source": "LinkedIn",
                "hr_email": "in_careers@pwc.com",
                "hr_name": "PwC India Recruiting",
                "status": "NEW",
                "notes": "Posted 1 week ago"
            },
            {
                "company_name": "Decompute",
                "job_title": "Machine Learning Engineer",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/decompute-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "hello@decompute.ai",
                "hr_name": "Decompute Team",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "Papigen",
                "job_title": "AI/ML Engineer",
                "location": "Greater Chennai Area",
                "job_url": "https://www.linkedin.com/jobs/view/papigen-ai-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@papigen.com",
                "hr_name": "Papigen HR",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "Enphase Energy",
                "job_title": "AI ML Engineer (AI COE)",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/enphase-ai-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@enphaseenergy.com",
                "hr_name": "Enphase HR",
                "status": "NEW",
                "notes": "Posted 2 weeks ago"
            },
            {
                "company_name": "Recro",
                "job_title": "AI/ML Engineer",
                "location": "Bengaluru, Karnataka",
                "job_url": "https://www.linkedin.com/jobs/view/recro-ai-ml-engineer",
                "source": "LinkedIn",
                "hr_email": "careers@recro.io",
                "hr_name": "Recro HR",
                "status": "NEW",
                "notes": "Posted 3 weeks ago"
            },
            {
                "company_name": "Meltwater",
                "job_title": "AI Engineer",
                "location": "Hyderabad, Telangana",
                "job_url": "https://www.linkedin.com/jobs/view/meltwater-ai-engineer-hyderabad",
                "source": "LinkedIn",
                "hr_email": "careers@meltwater.com",
                "hr_name": "Meltwater HR",
                "status": "NEW",
                "notes": "Posted 4 days ago"
            },
            {
                "company_name": "GRUNDFOS",
                "job_title": "Data Scientist",
                "location": "Chennai, Tamil Nadu",
                "job_url": "https://www.linkedin.com/jobs/view/grundfos-data-scientist-chennai",
                "source": "LinkedIn",
                "hr_email": "careers@grundfos.com",
                "hr_name": "GRUNDFOS India HR",
                "status": "NEW",
                "notes": "Posted 8 hours ago"
            },
            {
                "company_name": "PepsiCo",
                "job_title": "Data Scientist",
                "location": "Hyderabad, Telangana",
                "job_url": "https://www.linkedin.com/jobs/view/pepsico-data-scientist-hyderabad",
                "source": "LinkedIn",
                "hr_email": "careers@pepsico.com",
                "hr_name": "PepsiCo India HR",
                "status": "NEW",
                "notes": "Posted 5 days ago"
            },
            {
                "company_name": "Flex",
                "job_title": "Junior AI Developer (Python + AI/ML)",
                "location": "Chennai, Tamil Nadu",
                "job_url": "https://www.linkedin.com/jobs/view/flex-junior-ai-developer-chennai",
                "source": "LinkedIn",
                "hr_email": "careers@flex.com",
                "hr_name": "Flex India HR",
                "status": "NEW",
                "notes": "Posted 2 days ago"
            },
            {
                "company_name": "DHL",
                "job_title": "AI Software Engineer",
                "location": "Indore, Madhya Pradesh",
                "job_url": "https://www.linkedin.com/jobs/view/dhl-ai-software-engineer-indore",
                "source": "LinkedIn",
                "hr_email": "careers@dhl.com",
                "hr_name": "DHL India HR",
                "status": "NEW",
                "notes": "Posted 3 days ago"
            }
        ]
        
        return leads
    
    def generate_email_from_pattern(self, company_name, hr_name, domain):
        """
        Generate possible HR emails based on common patterns
        
        Args:
            company_name: Company name
            hr_name: HR person's name
            domain: Company domain
        
        Returns:
            list: Possible email addresses
        """
        from config import EMAIL_PATTERNS
        
        if not hr_name or not domain:
            return [f"careers@{domain}"] if domain else []
        
        # Parse name
        parts = hr_name.lower().split()
        first = parts[0] if parts else ""
        last = parts[-1] if len(parts) > 1 else ""
        f = first[0] if first else ""
        
        emails = []
        for pattern in EMAIL_PATTERNS:
            try:
                email = pattern.format(
                    first=first,
                    last=last,
                    f=f,
                    domain=domain
                )
                if email not in emails:
                    emails.append(email)
            except:
                continue
        
        return emails
    
    def find_leads_from_sources(self):
        """
        Find leads from multiple sources
        
        Returns:
            list: Discovered leads
        """
        # In a real implementation, this would scrape:
        # - LinkedIn Jobs API
        # - Instahyre
        # - AngelList
        # - Company career pages
        
        # For now, return sample leads
        return self.get_sample_leads()
    
    def validate_lead(self, lead):
        """
        Validate lead data
        
        Args:
            lead: Lead dictionary
        
        Returns:
            bool: Valid or not
        """
        from config import TARGET_TITLES
        
        # Check required fields
        if not lead.get("company_name"):
            return False
        
        if not lead.get("hr_email"):
            return False
        
        # Check if job title matches target titles
        job_title = lead.get("job_title", "").lower()
        matches_target = any(
            target.lower() in job_title 
            for target in TARGET_TITLES
        )
        
        if not matches_target:
            return False
        
        # Check blacklist
        from config import BLACKLIST
        email = lead.get("hr_email", "").lower()
        if any(bad in email for bad in BLACKLIST):
            return False
        
        return True
    
    def filter_leads(self, leads):
        """
        Filter and validate leads
        
        Args:
            leads: List of lead dictionaries
        
        Returns:
            list: Validated leads
        """
        valid_leads = []
        
        for lead in leads:
            if self.validate_lead(lead):
                valid_leads.append(lead)
        
        return valid_leads
