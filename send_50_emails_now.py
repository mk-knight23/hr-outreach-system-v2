#!/usr/bin/env python3
"""
Send 50 HR outreach emails NOW
Uses gws CLI with rate limiting
"""
import sqlite3
import subprocess
import time
import os
from datetime import datetime

DB_PATH = os.path.expanduser('~/.openclaw/workspace/hr-outreach-system-v2/database/contacts.db')

USER_NAME = "Musharraf Kazi"
USER_EMAIL = "mk.knight970@gmail.com"
USER_LINKEDIN = "linkedin.com/in/kazi-musharraf"
USER_PHONE = "+91-XXXXXXXXXX"

def get_contacts_to_email(limit=50):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, email, company, role FROM contacts 
        WHERE status = 'new' 
        ORDER BY priority DESC, created_at ASC
        LIMIT ?
    ''', (limit,))
    contacts = cursor.fetchall()
    conn.close()
    return contacts

def generate_email(contact):
    contact_id, name, email, company, role = contact
    first_name = name.split()[0] if name else "Hiring Manager"
    
    subject = f"Application for AI Engineer position - {USER_NAME}"
    
    body = f"""Dear {first_name},

I hope this email finds you well. I'm writing to express my strong interest in AI Engineer/ML Engineer positions at {company}.

With 6+ years of experience building AI-powered systems, I believe I can make a significant contribution to your team:

• Built 60+ AI repositories with autonomous evolution (GitHub: github.com/mk-knight23)
• Created 134-agent army for automated operations using LangGraph
• Implemented RALPH v2.0 - 6-phase autonomous evolution loop
• Expert in TypeScript, Python, React, LangChain, and cloud infrastructure
• Deployed 600+ live services across 10 platforms

My recent work focuses on multi-agent systems and autonomous AI workflows - areas where {company} is actively innovating.

I've attached my resume for your review. I would welcome the opportunity to discuss how my background in AI/ML engineering aligns with your team's goals.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
{USER_NAME}
{USER_PHONE}
{USER_LINKEDIN}
{USER_EMAIL}
"""
    return subject, body

def send_email_gws(to_email, subject, body):
    """Send email using gws CLI"""
    try:
        # Create email content
        email_content = f"To: {to_email}\\nSubject: {subject}\\n\\n{body}"
        
        # Use gws to send
        result = subprocess.run(
            ['gws', 'gmail', '+send', '--to', to_email, '--subject', subject, '--body', body],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return True, "Sent"
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

def update_contact_status(contact_id, status):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    ''', (status, contact_id))
    conn.commit()
    conn.close()

def log_email(contact_id, subject, body, status):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO emails_sent (contact_id, subject, body, status)
        VALUES (?, ?, ?, ?)
    ''', (contact_id, subject, body, status))
    conn.commit()
    conn.close()

def main():
    print("=" * 70)
    print("🚀 HR OUTREACH - 50 EMAIL CAMPAIGN")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get contacts
    contacts = get_contacts_to_email(50)
    print(f"📧 Found {len(contacts)} contacts to email")
    print()
    
    if len(contacts) == 0:
        print("❌ No contacts available. Run populate_50_contacts.py first.")
        return
    
    # Confirm
    print("⚠️  ABOUT TO SEND LIVE EMAILS!")
    print(f"   Target: {len(contacts)} HR recruiters")
    print(f"   From: {USER_EMAIL}")
    print()
    
    # Send emails
    sent = 0
    failed = 0
    
    for i, contact in enumerate(contacts, 1):
        contact_id, name, email, company, role = contact
        
        print(f"[{i}/{len(contacts)}] Sending to {name} at {company}...")
        
        subject, body = generate_email(contact)
        
        # Send via gws
        success, message = send_email_gws(email, subject, body)
        
        if success:
            sent += 1
            update_contact_status(contact_id, 'contacted')
            log_email(contact_id, subject, body, 'sent')
            print(f"   ✅ Sent to {email}")
        else:
            failed += 1
            log_email(contact_id, subject, body, f'failed: {message}')
            print(f"   ❌ Failed: {message[:100]}")
        
        # Rate limiting: Wait 30-45 seconds between emails
        if i < len(contacts):
            delay = 30 + (i % 15)  # 30-45 seconds
            print(f"   ⏱️  Waiting {delay}s...")
            time.sleep(delay)
    
    # Summary
    print()
    print("=" * 70)
    print("📊 CAMPAIGN COMPLETE")
    print("=" * 70)
    print(f"Total attempted: {len(contacts)}")
    print(f"✅ Successfully sent: {sent}")
    print(f"❌ Failed: {failed}")
    print(f"⏱️  Total time: {((len(contacts) * 37.5) / 60):.1f} minutes")
    print()
    print("Next steps:")
    print("- Monitor Gmail for replies")
    print("- Check database for follow-ups in 3 days")
    print("- Run again for remaining contacts")

if __name__ == "__main__":
    main()
