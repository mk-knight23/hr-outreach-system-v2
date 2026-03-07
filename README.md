# HR Outreach System v2 🚀

> **Ultimate automated HR outreach system for AI Engineer roles in India**

[![GitHub Actions](https://github.com/mk-knight23/hr-outreach-system-v2/workflows/HR%20Outreach%20Automation/badge.svg)](https://github.com/mk-knight23/hr-outreach-system-v2/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What This Does

- **Research**: Finds genuine HR/recruiter contacts from recent job postings
- **Personalize**: Creates tailored emails based on job requirements
- **Send**: Automated email campaigns via Google Workspace CLI
- **Track**: Monitors replies and engagement
- **Optimize**: Continuously improves based on response rates

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions (24/7)                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│  Research      │      │  Email Engine   │
│  (Find HRs)    │      │  (gws CLI)      │
└───────┬────────┘      └────────┬────────┘
        │                         │
        └────────────┬────────────┘
                     │
            ┌────────▼────────┐
            │   Database      │
            │  (SQLite)       │
            └─────────────────┘
```

## 📊 Current Status

| Metric | Target | Status |
|--------|--------|--------|
| HR Contacts | 50+ | 🔄 Building |
| Emails/Day | 100 | 🔄 Setting up |
| Reply Rate | 10%+ | 🔄 Tracking |
| Uptime | 24/7 | 🔄 Configuring |

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/mk-knight23/hr-outreach-system-v2.git
cd hr-outreach-system-v2

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your details

# 4. Build
npm run build

# 5. Initialize database
npm run db:migrate

# 6. Run
npm start
```

## 📧 Email Templates

The system includes smart templates that adapt based on:
- Job requirements
- Company culture
- Your matching skills
- Recent company news

## 🤖 Automation Schedule

- **Research**: Every 2 hours (find new job postings)
- **Send**: Every 2 hours during business hours (9 AM - 6 PM IST)
- **Follow-up**: Days 3, 7, 14
- **Analytics**: Daily reports

## 📈 Analytics

Track:
- Emails sent
- Open rates
- Reply rates
- Conversion to interviews

## 🔧 Tech Stack

- **Language**: TypeScript
- **Email**: Google Workspace CLI (gws)
- **Database**: SQLite
- **Automation**: GitHub Actions
- **Monitoring**: Winston logging

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

**Built with ❤️ by the 60-repo empire**
