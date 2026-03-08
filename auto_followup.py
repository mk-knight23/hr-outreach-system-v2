#!/usr/bin/env python3
"""
Automated Follow-Up System for HR Outreach
Sends Day 3, Day 7, Day 14 follow-ups automatically
"""
import sqlite3
import os
from datetime import datetime, timedelta
import subprocess

DB_PATH = os.path.expanduser('~/.openclaw/workspace/hr-outreach-system-v2/database/contacts.db')

def get_follow_ups(day):
    """Get contacts ready for follow-up"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=day)).strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT c.id, c.name, c.email, c.company, c.role,
               COUNT(e.id) as email_count
        FROM contacts c
        LEFT JOIN emails_sent e ON c.id = e.contact_id
        WHERE c.status = 'contacted'
        AND c.updated_at < ?
        GROUP BY c.id
        HAVING email_count = ?
    ''', (since, 1 if day == 3 else 2 if day == 7 else 3))
    
    contacts = cursor.fetchall()
    conn.close()
    return contacts

def generate_follow_up_email(contact, day):
    """Generate personalized follow-up email"""
    contact_id, name, email, company, role, email_count = contact
    first_name = name.split()[0] if name else "Hiring Manager"
    
    if day == 3:
        subject = f"Following up: AI Engineer Application - {name}"
        body = f"""Dear {first_name},

I hope you're having a great week. I wanted to follow up on my application for AI Engineer positions at {company} that I submitted a few days ago.

I'm still very excited about the opportunity and wanted to reiterate my enthusiasm for joining your team. My experience building autonomous multi-agent systems (60+ repos, 134 agents) would be particularly valuable for {company}'s AI initiatives.

If you need any additional information from me, please don't hesitate to ask.

Best regards,
Musharraf Kazi
+91-XXXXXXXXXX
linkedin.com/in/kazi-musharraf
mk.knight970@gmail.com
"""
    elif day == 7:
        subject = f"Quick follow-up: AI Engineer at {company}"
        body = f"""Hi {first_name},

I hope this message finds you well. I wanted to reach out again regarding the AI Engineer position at {company}.

I understand you likely have many applications to review. I wanted to share a quick update - I've recently completed work on an autonomous multi-agent system that orchestrates 134 AI agents across 60 repositories, which I believe demonstrates the kind of scalable AI architecture that would benefit {company}.

I'd love to discuss how I could bring similar innovation to your team.

Best,
Musharraf Kazi
mk.knight970@gmail.com
linkedin.com/in/kazi-musharraf
"""
    else:  # Day 14
        subject = f"Thank you for considering my application"
        body = f"""Hi {first_name},

I wanted to reach out one final time regarding the AI Engineer position at {company}.

I completely understand if the timing isn't right or if you've moved forward with other candidates. I remain very interested in {company} and would welcome the opportunity to connect in the future if new roles open up.

Thank you for your time throughout this process. I wish you and the team continued success.

Best regards,
Musharraf Kazi
mk.knight970@gmail.com
linkedin.com/in/kazi-musharraf
"""
    
    return subject, body

def send_email(name, email, subject, body):
    """Send email using gws"""
    try:
        result = subprocess.run(
            ['gws', 'gmail', '+send', '--to', email, '--subject', subject, '--body', body],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except:
        return False

def log_email(contact_id, subject, body):
    """Log email to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO emails_sent (contact_id, subject, body, status)
        VALUES (?, ?, ?, 'sent')
    ''', (contact_id, subject, body))
    conn.commit()
    conn.close()

def main():
    print("=" * 60)
    print("🤖 AUTOMATED FOLLOW-UP SYSTEM")
    print("=" * 60)
    print()
    
    today = datetime.now()
    
    # Check for Day 3, 7, 14 follow-ups
    for day in [3, 7, 14]:
        contacts = get_follow_ups(day)
        
        if contacts:
            print(f"📧 Day {day} Follow-ups: {len(contacts)} contacts")
            
            for contact in contacts:
                contact_id, name, email, company, role, email_count = contact
                
                subject, body = generate_follow_up_email(contact, day)
                
                print(f"  Sending to {name} at {company}...", end=' ')
                
                if send_email(name, email, subject, body):
                    log_email(contact_id, subject, body)
                    print("✅ Sent")
                else:
                    print("❌ Failed")
            
            print()
        else:
            print(f"📧 Day {day}: No contacts ready for follow-up")
    
    print("=" * 60)
    print("✅ Follow-up check complete")
    print("=" * 60)

if __name__ == "__main__":
    main()
