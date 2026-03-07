"""
Configuration and constants for HR Outreach System
"""
import os
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Email Sending Limits (Gmail rate limiting protection)
MAX_EMAILS_PER_DAY = 20
MAX_EMAILS_PER_HOUR = 5
MIN_DELAY_BETWEEN_EMAILS = 60  # seconds

# Follow-up Cadence (days)
FOLLOWUP_DAYS = [3, 7, 14]

# Email Status Codes
class Status:
    NEW = "NEW"
    EMAILED = "EMAILED"
    FOLLOWUP1 = "FOLLOWUP1"
    FOLLOWUP2 = "FOLLOWUP2"
    FOLLOWUP3 = "FOLLOWUP3"
    REPLIED = "REPLIED"
    CLOSED = "CLOSED"
    BOUNCED = "BOUNCED"
    UNSUBSCRIBED = "UNSUBSCRIBED"

# Google Sheets Configuration
SHEET_NAME = "HR Outreach Tracker v2"
WORKSHEET_NAME = "Leads"

# Sheet Headers
SHEET_HEADERS = [
    "Lead ID",
    "Company Name", 
    "HR Email",
    "HR Name",
    "Job Title",
    "Job URL",
    "Source",
    "Status",
    "First Contact Date",
    "Last Contact Date",
    "Follow-up Count",
    "Notes",
    "Location",
    "Salary Range",
    "Date Added"
]

# Job Sources
JOB_SOURCES = [
    "LinkedIn",
    "AngelList",
    "Instahyre",
    "Cutshort",
    "Naukri",
    "Company Website",
    "Referral",
    "Other"
]

# Target Job Titles for AI Engineer Roles
TARGET_TITLES = [
    "AI Engineer",
    "Machine Learning Engineer",
    "ML Engineer",
    "Python ML Engineer",
    "Data Scientist",
    "AI Developer",
    "AI/ML Engineer",
    "AI Software Engineer",
    "ML Platform Engineer",
    "Applied Scientist",
    "Research Engineer",
    "Gen AI Developer",
    "LLM Engineer",
    "AI Full Stack"
]

# Target Cities in India
TARGET_CITIES = [
    "Bengaluru",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Mumbai",
    "Pune",
    "Gurugram",
    "Gurgaon",
    "Noida",
    "Delhi",
    "Remote",
    "India"
]

# Common Email Patterns for Indian Companies
EMAIL_PATTERNS = [
    "{first}@{domain}",
    "{first}.{last}@{domain}",
    "{first}{last}@{domain}",
    "{first}_{last}@{domain}",
    "{f}{last}@{domain}",
    "hr@{domain}",
    "careers@{domain}",
    "talent@{domain}",
    "hiring@{domain}",
    "recruitment@{domain}",
    "jobs@{domain}",
    "join@{domain}"
]

# Blacklist - companies/keywords to skip
BLACKLIST = [
    "scam",
    "fake",
    "test",
    "noreply",
    "do-not-reply",
    "no-reply"
]

def get_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def get_date_string():
    """Get current date as string"""
    return datetime.now().strftime("%Y-%m-%d")
