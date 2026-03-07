#!/usr/bin/env python3
"""
Main runner script for HR Outreach Automation
"""
import sys
import os
import argparse

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from outreach_engine import OutreachEngine

def main():
    parser = argparse.ArgumentParser(description='HR Outreach Automation Engine')
    parser.add_argument('--spreadsheet-id', help='Google Sheet ID for tracking')
    parser.add_argument('--dry-run', action='store_true', help='Run without sending emails')
    parser.add_argument('--action', choices=['full', 'scrape', 'outreach', 'followup', 'replies', 'stats'],
                        default='full', help='Action to perform')
    
    args = parser.parse_args()
    
    # Get spreadsheet ID from environment or args
    spreadsheet_id = args.spreadsheet_id or os.environ.get('SPREADSHEET_ID')
    
    print("=" * 60)
    print("HR OUTREACH AUTOMATION ENGINE v2")
    print("=" * 60)
    
    if args.dry_run:
        print("⚠️  DRY RUN MODE - No emails will be sent")
        print()
    
    # Initialize engine
    engine = OutreachEngine(spreadsheet_id=spreadsheet_id, dry_run=args.dry_run)
    
    # Execute action
    if args.action == 'full':
        success = engine.run_full_cycle()
        return 0 if success else 1
    
    elif args.action == 'scrape':
        count = engine.process_new_leads(max_leads=10)
        print(f"\nAdded {count} new leads")
        return 0
    
    elif args.action == 'outreach':
        count = engine.send_outreach_emails(max_emails=5)
        print(f"\nSent {count} outreach emails")
        return 0
    
    elif args.action == 'followup':
        count = engine.send_followups(max_emails=5)
        print(f"\nSent {count} follow-ups")
        return 0
    
    elif args.action == 'replies':
        count = engine.check_for_replies()
        print(f"\nFound {count} replies")
        return 0
    
    elif args.action == 'stats':
        stats = engine.get_stats()
        print("\n--- Statistics ---")
        print(f"Total leads: {stats['total_leads']}")
        print(f"Emails sent today: {stats['emails_sent_today']}")
        print("\nBy status:")
        for status, count in stats['by_status'].items():
            print(f"  {status}: {count}")
        return 0

if __name__ == "__main__":
    sys.exit(main())
