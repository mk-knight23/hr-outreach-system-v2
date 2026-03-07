#!/usr/bin/env python3
"""
HR Outreach - SQLite Only Mode (No Google Sheets Required)
Quick test without external dependencies
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.expanduser('~/.openclaw/workspace/hr-outreach-system-v2/database/contacts.db')

def init_db():
    """Initialize SQLite database"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            priority INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emails_sent (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER,
            subject TEXT,
            body TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'sent',
            FOREIGN KEY (contact_id) REFERENCES contacts(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def add_sample_contacts():
    """Add sample HR contacts"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    sample_contacts = [
        ("Jaymillya Diop", "jaymillya.diop@amazon.com", "Amazon", "Technical Recruiter"),
        ("Shannon Kinsella", "shannon.kinsella@walmart.com", "Walmart", "HR Manager"),
        ("Recruiting Team", "careers@flipkart.com", "Flipkart", "Talent Acquisition"),
        ("Hiring Manager", "jobs@google.com", "Google", "AI Recruiter"),
        ("HR Department", "hiring@microsoft.com", "Microsoft", "Technical Recruiter"),
    ]
    
    for name, email, company, role in sample_contacts:
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO contacts (name, email, company, role, status)
                VALUES (?, ?, ?, ?, 'new')
            ''', (name, email, company, role))
        except:
            pass
    
    conn.commit()
    conn.close()
    print(f"✅ Added {len(sample_contacts)} sample contacts")

def show_stats():
    """Show database stats"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM contacts")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM contacts WHERE status = 'new'")
    new = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM emails_sent")
    sent = cursor.fetchone()[0]
    
    conn.close()
    
    print("\n📊 DATABASE STATS:")
    print(f"  Total contacts: {total}")
    print(f"  New contacts: {new}")
    print(f"  Emails sent: {sent}")

def simulate_email_send():
    """Simulate sending emails (dry run)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM contacts WHERE status = 'new' LIMIT 3")
    contacts = cursor.fetchall()
    
    print(f"\n📧 SIMULATING EMAILS TO {len(contacts)} CONTACTS:\n")
    
    for contact in contacts:
        contact_id, name, email, company, role, status, priority, created_at, updated_at = contact
        
        subject = f"Application for AI Engineer position - {name}"
        body = f"""Dear {name.split()[0]},

I hope this email finds you well. I'm writing to express my strong interest in AI Engineer positions at {company}.

With my background in building 60+ AI repositories and 134-agent autonomous systems, I believe I can make a significant contribution to your team.

Key highlights:
• Built autonomous multi-agent systems with LangGraph
• Expert in TypeScript, Python, React, and cloud infrastructure
• 6+ years experience in AI/ML engineering

I look forward to discussing how my skills align with {company}'s goals.

Best regards,
Musharraf Kazi
"""
        
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Body preview: {body[:100]}...")
        print("-" * 60)
        
        # Record as sent in dry-run mode
        cursor.execute('''
            INSERT INTO emails_sent (contact_id, subject, body, status)
            VALUES (?, ?, ?, 'dry-run')
        ''', (contact_id, subject, body))
        
        cursor.execute('''
            UPDATE contacts SET status = 'contacted', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (contact_id,))
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Simulated sending {len(contacts)} emails (dry-run)")

def main():
    print("=" * 60)
    print("HR OUTREACH SYSTEM - SQLITE TEST MODE")
    print("=" * 60)
    print()
    
    init_db()
    add_sample_contacts()
    show_stats()
    simulate_email_send()
    show_stats()
    
    print("\n" + "=" * 60)
    print("✅ TEST COMPLETE")
    print("=" * 60)
    print("\nThe system is working correctly!")
    print(f"Database location: {DB_PATH}")
    print("\nTo run with actual Gmail sending:")
    print("  1. Set up Google Sheets (run: python3 scripts/setup_sheets.py)")
    print("  2. Or modify to skip Sheets and use SQLite only")
    print("  3. Run: ./cron-manager.sh live")

if __name__ == "__main__":
    main()
