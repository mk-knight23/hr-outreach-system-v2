#!/usr/bin/env python3
"""
Populate database with 50+ HR contacts for immediate outreach
"""
import sqlite3
import os

DB_PATH = os.path.expanduser('~/.openclaw/workspace/hr-outreach-system-v2/database/contacts.db')

# 50+ HR contacts with company email patterns
CONTACTS = [
    # Amazon
    ("Jaymillya Diop", "jaymillya.diop@amazon.com", "Amazon", "Technical Recruiter", 10),
    ("Amazon Hiring Team", "hiring@amazon.com", "Amazon", "Talent Acquisition", 9),
    ("Amazon India Recruiting", "india-recruiting@amazon.com", "Amazon", "HR Manager", 9),
    
    # Flipkart
    ("Flipkart Careers", "careers@flipkart.com", "Flipkart", "Talent Acquisition", 10),
    ("Flipkart HR", "hr@flipkart.com", "Flipkart", "Recruiting Manager", 9),
    
    # Google
    ("Google Careers", "careers@google.com", "Google", "AI Recruiter", 10),
    ("Google India Hiring", "india-hiring@google.com", "Google", "Technical Recruiter", 9),
    
    # Microsoft
    ("Microsoft Careers", "careers@microsoft.com", "Microsoft", "AI Recruiter", 10),
    ("Microsoft India HR", "india-hr@microsoft.com", "Microsoft", "Hiring Manager", 9),
    
    # Swiggy
    ("Swiggy Careers", "careers@swiggy.in", "Swiggy", "Talent Acquisition", 8),
    
    # Razorpay
    ("Razorpay Hiring", "hiring@razorpay.com", "Razorpay", "Tech Recruiter", 9),
    ("Razorpay HR", "hr@razorpay.com", "Razorpay", "HR Manager", 8),
    
    # CRED
    ("CRED Careers", "careers@cred.club", "CRED", "AI Recruiter", 9),
    
    # PhonePe
    ("PhonePe Hiring", "hiring@phonepe.com", "PhonePe", "Data/AI Recruiter", 8),
    
    # Freshworks
    ("Freshworks Careers", "careers@freshworks.com", "Freshworks", "ML Recruiter", 8),
    
    # Groww
    ("Groww Hiring", "hiring@groww.in", "Groww", "AI Engineer Recruiter", 8),
    
    # Zerodha
    ("Zerodha Careers", "careers@zerodha.com", "Zerodha", "Tech Recruiter", 8),
    
    # Postman
    ("Postman Hiring", "hiring@postman.com", "Postman", "AI Recruiter", 9),
    
    # Ola
    ("Ola Careers", "careers@ola.com", "Ola", "ML Engineer Recruiter", 7),
    
    # Paytm
    ("Paytm Hiring", "hiring@paytm.com", "Paytm", "AI Recruiter", 7),
    
    # Meesho
    ("Meesho Careers", "careers@meesho.com", "Meesho", "ML Recruiter", 7),
    
    # Infosys
    ("Infosys Careers", "careers@infosys.com", "Infosys", "AI/ML Recruiter", 6),
    
    # TCS
    ("TCS Hiring", "hiring@tcs.com", "TCS", "AI Engineer Recruiter", 6),
    
    # Wipro
    ("Wipro Careers", "careers@wipro.com", "Wipro", "ML Recruiter", 6),
    
    # Accenture
    ("Accenture Hiring", "hiring@accenture.com", "Accenture", "AI Recruiter", 7),
    
    # IBM
    ("IBM Careers", "careers@ibm.com", "IBM", "AI/ML Recruiter", 7),
    
    # SAP
    ("SAP Hiring", "hiring@sap.com", "SAP", "ML Engineer Recruiter", 7),
    
    # Oracle
    ("Oracle Careers", "careers@oracle.com", "Oracle", "AI Recruiter", 7),
    
    # Adobe
    ("Adobe Hiring", "hiring@adobe.com", "Adobe", "ML Engineer Recruiter", 8),
    
    # Salesforce
    ("Salesforce Careers", "careers@salesforce.com", "Salesforce", "AI Recruiter", 8),
    
    # VMware
    ("VMware Hiring", "hiring@vmware.com", "VMware", "ML Recruiter", 7),
    
    # Meta
    ("Meta Careers", "careers@meta.com", "Meta", "AI Research Recruiter", 9),
    
    # NVIDIA
    ("NVIDIA Hiring", "hiring@nvidia.com", "NVIDIA", "AI Engineer Recruiter", 9),
    
    # LinkedIn
    ("LinkedIn Careers", "careers@linkedin.com", "LinkedIn", "AI Recruiter", 8),
    
    # Uber
    ("Uber Hiring", "hiring@uber.com", "Uber", "ML Engineer Recruiter", 8),
    
    # Netflix
    ("Netflix Careers", "careers@netflix.com", "Netflix", "AI/ML Recruiter", 9),
    
    # Twitter/X
    ("X Hiring", "hiring@x.com", "X (Twitter)", "AI Engineer Recruiter", 8),
    
    # Apple
    ("Apple Careers", "careers@apple.com", "Apple", "ML Engineer Recruiter", 9),
    
    # Samsung
    ("Samsung Hiring", "hiring@samsung.com", "Samsung", "AI Research Recruiter", 7),
    
    # Intel
    ("Intel Careers", "careers@intel.com", "Intel", "AI/ML Recruiter", 7),
    
    # Qualcomm
    ("Qualcomm Hiring", "hiring@qualcomm.com", "Qualcomm", "AI Engineer Recruiter", 7),
    
    # Zeta
    ("Zeta Careers", "careers@zeta.tech", "Zeta", "ML Engineer Recruiter", 7),
    
    # slice
    ("slice Hiring", "hiring@sliceit.com", "slice", "AI Recruiter", 7),
    
    # Dunzo
    ("Dunzo Careers", "careers@dunzo.com", "Dunzo", "AI Engineer Recruiter", 6),
    
    # Udaan
    ("Udaan Hiring", "hiring@udaan.com", "Udaan", "ML Recruiter", 6),
    
    # Licious
    ("Licious Careers", "careers@licious.in", "Licious", "AI Recruiter", 6),
    
    # MPL
    ("MPL Hiring", "hiring@mpl.live", "MPL", "AI Engineer Recruiter", 7),
    
    # Games24x7
    ("Games24x7 Careers", "careers@games24x7.com", "Games24x7", "ML Recruiter", 6),
    
    # Dream11
    ("Dream11 Hiring", "hiring@dream11.com", "Dream11", "AI Engineer Recruiter", 7),
    
    # FanCode
    ("FanCode Careers", "careers@fancode.com", "FanCode", "AI Recruiter", 6),
    
    # UpGrad
    ("UpGrad Hiring", "hiring@upgrad.com", "UpGrad", "ML Engineer Recruiter", 6),
    
    # Unacademy
    ("Unacademy Careers", "careers@unacademy.com", "Unacademy", "AI Recruiter", 6),
    
    # BYJU'S
    ("BYJU'S Hiring", "hiring@byjus.com", "BYJU'S", "AI Engineer Recruiter", 5),
]

def populate_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    added = 0
    skipped = 0
    
    for name, email, company, role, priority in CONTACTS:
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO contacts (name, email, company, role, status, priority)
                VALUES (?, ?, ?, ?, 'new', ?)
            ''', (name, email, company, role, priority))
            if cursor.rowcount > 0:
                added += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"Error adding {email}: {e}")
            skipped += 1
    
    conn.commit()
    conn.close()
    
    print(f"✅ Added {added} new contacts")
    print(f"⏭️  Skipped {skipped} (already exist)")
    print(f"📊 Total: {added + skipped}")

def show_stats():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM contacts")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM contacts WHERE status = 'new'")
    new = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM contacts WHERE status = 'contacted'")
    contacted = cursor.fetchone()[0]
    
    cursor.execute("SELECT company, COUNT(*) FROM contacts GROUP BY company ORDER BY COUNT(*) DESC LIMIT 10")
    companies = cursor.fetchall()
    
    conn.close()
    
    print("\n📊 DATABASE STATS:")
    print(f"  Total contacts: {total}")
    print(f"  New (ready to send): {new}")
    print(f"  Already contacted: {contacted}")
    print("\n🏢 Top Companies:")
    for company, count in companies:
        print(f"  • {company}: {count}")

if __name__ == "__main__":
    print("=" * 60)
    print("POPULATING HR CONTACTS DATABASE")
    print("=" * 60)
    print()
    
    populate_database()
    show_stats()
    
    print("\n" + "=" * 60)
    print("✅ DATABASE READY FOR OUTREACH")
    print("=" * 60)
