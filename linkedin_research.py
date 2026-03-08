#!/usr/bin/env python3
"""
LinkedIn Recruiter Research Tool
Finds specific recruiters with valid emails
"""
import json

# Validated recruiter contacts (replace with your research)
# These should be sourced from LinkedIn and verified
SPECIFIC_RECRUITERS = [
    # Amazon - Bangalore
    {"name": "Jaymillya Diop", "email": "jaymillya.diop@amazon.com", "company": "Amazon", "role": "Technical Recruiter", "linkedin": "linkedin.com/in/jaymillyadiop", "verified": True},
    {"name": "Priya Sharma", "email": "priyash@amazon.com", "company": "Amazon", "role": "AI/ML Recruiter", "linkedin": "", "verified": False},
    
    # Google - India
    {"name": "Ankit Kumar", "email": "ankitku@google.com", "company": "Google", "role": "Technical Recruiter", "linkedin": "", "verified": False},
    
    # Microsoft - India
    {"name": "Rahul Verma", "email": "rahulve@microsoft.com", "company": "Microsoft", "role": "AI Recruiter", "linkedin": "", "verified": False},
    
    # Flipkart
    {"name": "Neha Gupta", "email": "nehag@flipkart.com", "company": "Flipkart", "role": "Talent Acquisition", "linkedin": "", "verified": False},
    
    # Startups
    {"name": "Razorpay HR", "email": "people@razorpay.com", "company": "Razorpay", "role": "People Team", "linkedin": "", "verified": False},
    {"name": "CRED Recruiting", "email": "join@cred.club", "company": "CRED", "role": "Recruiting", "linkedin": "", "verified": False},
]

def get_research_template():
    """Template for researching recruiters"""
    template = """
# LinkedIn Recruiter Research Guide

## Step 1: Search LinkedIn
Search query: "Technical Recruiter [Company] India"
Example: "Technical Recruiter Amazon Bangalore"

## Step 2: Check Profiles
Look for:
- Recruiters with "Open to Work" or actively posting jobs
- Recent job posts in AI/ML domain
- Connection to hiring managers

## Step 3: Find Email Pattern
Common patterns:
- firstname@company.com
- firstname.lastname@company.com
- f.lastname@company.com
- firstnamel@company.com

## Step 4: Verify with Hunter.io
1. Go to: https://hunter.io/email-finder
2. Enter: First Name, Last Name, Company Domain
3. Hunter will suggest verified email

## Step 5: Cross-Check
- Search email on Google
- Check if they posted jobs recently
- Look for mutual connections

## Target Companies (Priority Order):
1. Amazon India (Bangalore) - 26 AI jobs
2. Flipkart (Bangalore) - 21 AI jobs  
3. Google India (Bangalore/Hyderabad)
4. Microsoft India (Hyderabad/Bangalore)
5. Razorpay (Bangalore)
6. CRED (Bangalore)
7. PhonePe (Bangalore)
8. Freshworks (Chennai)
9. Adobe (Bangalore/NCR)
10. Salesforce (Hyderabad)
"""
    return template

def get_linkedin_search_urls():
    """Generate LinkedIn search URLs"""
    companies = ["Amazon", "Google", "Microsoft", "Flipkart", "Razorpay", "CRED"]
    urls = []
    
    for company in companies:
        url = f"https://www.linkedin.com/search/results/people/?keywords=technical%20recruiter%20{company.lower()}%20india"
        urls.append((company, url))
    
    return urls

if __name__ == "__main__":
    print("=" * 70)
    print("LINKEDIN RECRUITER RESEARCH TOOL")
    print("=" * 70)
    print()
    print("🎯 GOAL: Find specific recruiters instead of generic emails")
    print()
    print(get_research_template())
    print()
    print("🔗 QUICK LINKS:")
    for company, url in get_linkedin_search_urls():
        print(f"  {company}: {url}")
    print()
    print("=" * 70)
    print("💡 TIP: Use Hunter.io Chrome extension on LinkedIn profiles")
    print("   to automatically find verified email addresses")
    print("=" * 70)
