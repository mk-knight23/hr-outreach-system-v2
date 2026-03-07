"""
Utility functions
"""
import os
import json
import re
from datetime import datetime

def sanitize_filename(filename):
    """Sanitize string for use as filename"""
    return re.sub(r'[^\w\s-]', '', filename).strip().replace(' ', '_')

def load_json(filepath):
    """Load JSON file"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def save_json(filepath, data):
    """Save data to JSON file"""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False

def ensure_dir(directory):
    """Ensure directory exists"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def format_date(date_obj):
    """Format date for display"""
    if isinstance(date_obj, str):
        try:
            date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
        except:
            return date_obj
    return date_obj.strftime("%Y-%m-%d %H:%M")

def days_since(date_str):
    """Calculate days since date"""
    try:
        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return (datetime.now() - date).days
    except:
        return 0

def truncate_string(s, max_len=100):
    """Truncate string with ellipsis"""
    if len(s) <= max_len:
        return s
    return s[:max_len-3] + "..."

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def extract_domain(email):
    """Extract domain from email"""
    try:
        return email.split('@')[1]
    except:
        return ""

def get_initials(name):
    """Get initials from name"""
    parts = name.split()
    return ''.join(p[0] for p in parts if p).upper()
