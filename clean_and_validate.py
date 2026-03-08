#!/usr/bin/env python3
"""
Clean and validate all emails in database
Removes invalid emails to prevent bounces
"""
import sqlite3
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from email_validator import EmailValidator

DB_PATH = os.path.expanduser('~/.openclaw/workspace/hr-outreach-system-v2/database/contacts.db')

def clean_database():
    """Validate all emails and mark/remove invalid ones"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all contacts
    cursor.execute("SELECT id, name, email, company FROM contacts WHERE status = 'new'")
    contacts = cursor.fetchall()
    
    print("=" * 70)
    print("🔍 VALIDATING EMAILS")
    print("=" * 70)
    print(f"Total contacts to validate: {len(contacts)}")
    print()
    
    validator = EmailValidator()
    
    valid_emails = []
    invalid_emails = []
    role_based_emails = []
    
    for contact_id, name, email, company in contacts:
        print(f"Checking: {email} ({company})...", end=' ')
        
        is_valid, status, details = validator.validate(email)
        
        if is_valid:
            if details.get('role_based'):
                role_based_emails.append((contact_id, email, company, details))
                print(f"⚠️  ROLE-BASED ({details.get('score', 0)} pts)")
            else:
                valid_emails.append((contact_id, email, company, details))
                print(f"✅ VALID ({details.get('score', 0)} pts)")
        else:
            invalid_emails.append((contact_id, email, company, status, details))
            print(f"❌ INVALID ({status})")
            
            # Mark as invalid in database
            cursor.execute('''
                UPDATE contacts SET status = 'invalid', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (contact_id,))
    
    conn.commit()
    conn.close()
    
    # Summary
    print()
    print("=" * 70)
    print("📊 VALIDATION SUMMARY")
    print("=" * 70)
    print(f"✅ Valid personal emails: {len(valid_emails)}")
    print(f"⚠️  Role-based emails: {len(role_based_emails)}")
    print(f"❌ Invalid emails: {len(invalid_emails)}")
    print()
    
    if invalid_emails:
        print("❌ INVALID EMAILS REMOVED:")
        for contact_id, email, company, status, details in invalid_emails:
            print(f"  • {email} ({company}) - {status}")
        print()
    
    if role_based_emails:
        print("⚠️  ROLE-BASED EMAILS (Use with caution):")
        for contact_id, email, company, details in role_based_emails:
            print(f"  • {email} ({company})")
        print()
    
    print("💡 RECOMMENDATIONS:")
    print("  1. Use LinkedIn Sales Navigator to find specific recruiters")
    print("  2. Check company career pages for updated email formats")
    print("  3. Use Hunter.io Email Finder for better accuracy")
    print("  4. Consider verifying with phone calls for high-value targets")
    print()
    
    total_usable = len(valid_emails) + len(role_based_emails)
    print(f"🎯 TOTAL USABLE: {total_usable} contacts")
    print()
    
    return total_usable

def find_specific_recruiters():
    """Research specific recruiters using LinkedIn patterns"""
    print("=" * 70)
    print("🔍 RECOMMENDED: Find Specific Recruiters")
    print("=" * 70)
    print()
    print("Instead of generic emails, search LinkedIn for:")
    print()
    print("  • 'Technical Recruiter at Amazon' + Bangalore")
    print("  • 'AI/ML Recruiter at Google' + India")
    print("  • 'Talent Acquisition at Microsoft' + Hyderabad")
    print("  • 'HR Manager at Flipkart' + Bangalore")
    print()
    print("LinkedIn URL patterns:")
    print("  linkedin.com/search/results/people/?keywords=technical%20recruiter%20amazon")
    print()
    print("Once you find specific recruiters, use Hunter.io to verify their email:")
    print("  https://hunter.io/email-finder")
    print()

if __name__ == "__main__":
    clean_database()
    find_specific_recruiters()
