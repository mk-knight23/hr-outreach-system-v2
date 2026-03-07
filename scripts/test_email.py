#!/usr/bin/env python3
"""
Test email sending
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from gmail_client import GmailClient
from email_templates import EmailTemplates

def main():
    print("=" * 60)
    print("HR OUTREACH - EMAIL TEST")
    print("=" * 60)
    
    # Test connection
    client = GmailClient(dry_run=True)
    print("\nTesting Gmail connection...")
    if not client.test_connection():
        print("✗ Gmail connection failed!")
        print("\nMake sure you've authenticated with:")
        print("  gws auth login")
        return 1
    
    print("✓ Gmail connection successful!")
    
    # Show sample email
    templates = EmailTemplates()
    subject, body = templates.cold_outreach(
        company_name="Test Company",
        hr_name="John Doe",
        job_title="AI Engineer"
    )
    
    print("\n--- Sample Email ---")
    print(f"Subject: {subject}")
    print(f"\nBody:\n{body[:500]}...")
    
    print("\n✓ Test completed successfully")
    print("\nTo send a real test email, update this script with:")
    print("  client = GmailClient(dry_run=False)")
    print("  client.send_email('your-email@example.com', subject, body)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
