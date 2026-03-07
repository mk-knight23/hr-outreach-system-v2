#!/usr/bin/env python3
"""
Setup script for HR Outreach System
Creates Google Sheet and initializes structure
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from sheets_tracker import SheetsTracker

def main():
    print("=" * 60)
    print("HR OUTREACH SYSTEM - SETUP")
    print("=" * 60)
    
    # Create tracker
    tracker = SheetsTracker()
    
    print("\nCreating Google Sheet for lead tracking...")
    spreadsheet_id = tracker.create_spreadsheet("HR Outreach Tracker v2")
    
    if spreadsheet_id:
        print(f"\n✓ SUCCESS!")
        print(f"Spreadsheet ID: {spreadsheet_id}")
        print(f"URL: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
        print(f"\nSave this ID in your environment variables:")
        print(f"  export SPREADSHEET_ID={spreadsheet_id}")
        return 0
    else:
        print("\n✗ Failed to create spreadsheet")
        return 1

if __name__ == "__main__":
    sys.exit(main())
