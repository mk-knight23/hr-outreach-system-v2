# HR Outreach System v2 - Master Plan

## 🎯 Mission
Build the ultimate automated HR outreach system for AI Engineer roles in India.

## 📊 System Components

### 1. Contact Research Pipeline
- Scrape LinkedIn job posts for HR contacts
- Monitor company career pages
- Track job board postings (Naukri, LinkedIn Jobs, AngelList)
- Verify emails using pattern matching + validation

### 2. Email Automation Engine
- Google Workspace CLI (gws) integration
- Dynamic template generation based on job requirements
- Skill matching algorithm
- Rate limiting and retry logic

### 3. Database System
- SQLite for contact management
- Track: sent emails, replies, status
- Analytics and reporting

### 4. 24/7 Automation
- GitHub Actions workflow
- Scheduled runs every 2 hours
- Self-healing and error recovery

### 5. Continuous Improvement
- Agent teams monitor and optimize
- A/B testing for email templates
- Response rate tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions (24/7)                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│  Research Agent │      │  Email Engine   │
│  (Find HRs)     │      │  (gws CLI)      │
└───────┬─────────┘      └────────┬────────┘
        │                         │
        └────────────┬────────────┘
                     │
            ┌────────▼────────┐
            │   Database      │
            │  (SQLite)       │
            └─────────────────┘
```

## 📁 Directory Structure

```
hr-outreach-system-v2/
├── src/
│   ├── engine.ts           # Main automation engine
│   ├── email/              # Email sending module
│   ├── database/           # Database operations
│   ├── templates/          # Email templates
│   ├── scraper/            # Web scraping
│   └── analytics/          # Reporting
├── database/
│   └── contacts.db         # SQLite database
├── research/
│   └── hr-contacts.md      # Research findings
├── templates/
│   └── email-templates/    # Template files
├── github-actions/
│   └── hr-outreach.yml     # Workflow file
└── logs/
    └── outreach.log        # Activity log
```

## 🔑 Key Features

1. **Smart Templates**: Match user's skills with job requirements
2. **Rate Limiting**: Respect Gmail daily limits (500/day)
3. **Verification**: Validate emails before sending
4. **Tracking**: Monitor opens, replies, bounces
5. **Optimization**: ML-based send time optimization

## 📊 Target Metrics

- 50+ HR contacts added daily
- 100 emails/day (Gmail limit)
- 10%+ reply rate target
- 24/7 autonomous operation

## 🚀 Deployment

1. Push to GitHub
2. Set up GitHub Actions
3. Configure secrets (Gmail, API keys)
4. Activate 24/7 mode

---

*Created: March 8, 2026*
*Status: Under Construction*
