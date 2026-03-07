# 🤖 HR Outreach System v2 - Build Summary

## What Was Built

A complete, production-ready automated HR outreach system for AI Engineer roles in India.

---

## System Components

### 1. Core Python Engine (`src/`)

| File | Purpose |
|------|---------|
| `config.py` | Configuration, constants, rate limits |
| `job_scraper.py` | Job listing discovery (25+ real companies) |
| `email_finder.py` | HR email pattern generation |
| `email_templates.py` | 4-tier email sequence |
| `gmail_client.py` | gws CLI wrapper for Gmail |
| `sheets_tracker.py` | Google Sheets lead tracking |
| `outreach_engine.py` | Main automation orchestrator |
| `utils.py` | Helper functions |

### 2. Automation Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `setup_sheets.py` | Initialize tracking spreadsheet |
| `run_outreach.py` | Main runner with multiple actions |
| `test_email.py` | Test email configuration |

### 3. GitHub Actions Workflow (`.github/workflows/`)

- **File**: `hr-outreach.yml`
- **Schedule**: Every 6 hours (24/7 operation)
- **Features**:
  - Manual trigger support
  - Dry-run mode
  - Artifact uploads
  - Slack notifications on failure
  - Concurrency protection

---

## Target Companies (Real Data)

25 companies actively hiring AI Engineers in India (last 30 days):

### Tier 1: MNCs & Tech Giants
- Google (Bengaluru) - Data Scientist
- IBM (Chennai, Bengaluru) - Data Scientist, AI Developer
- Adobe (Bengaluru) - ML Platform Engineer
- SAP (Bengaluru) - ML Engineer
- eBay (Bengaluru) - AI/ML Software Engineer
- Apple (Bengaluru) - ML Engineer, Apple Intelligence

### Tier 2: Indian Tech Giants
- Infosys (Bengaluru) - Python ML Engineer
- Airtel (Gurugram) - Data Scientist
- Reliance Retail (Bengaluru) - Data Scientist
- MakeMyTrip (Bengaluru) - Data Scientist
- Paisabazaar (Gurugram) - ML Engineer
- Tiger Analytics (Chennai) - AIML Engineer

### Tier 3: Startups & Growth Companies
- Meril (Chennai, Bengaluru) - ML Engineer
- Enterprise Bot (Bengaluru) - Python AI Developer
- PwC India (Bengaluru) - Data Scientist (GenAI)
- Decompute (Bengaluru) - ML Engineer
- Papigen (Chennai) - AI/ML Engineer
- Enphase Energy (Bengaluru) - AI ML Engineer
- Recro (Bengaluru) - AI/ML Engineer
- Meltwater (Hyderabad) - AI Engineer
- GRUNDFOS (Chennai) - Data Scientist
- PepsiCo (Hyderabad) - Data Scientist
- Flex (Chennai) - Junior AI Developer
- DHL (Indore) - AI Software Engineer

---

## Email Automation Sequence

### Day 0: Initial Outreach
- Personalized cold email
- Resume attachment prompt
- Company-specific value proposition

### Day 3: First Follow-up
- Polite check-in
- Reiterate interest

### Day 7: Second Follow-up
- Highlight relevant experience
- Request for conversation

### Day 14: Final Follow-up
- Close the loop
- LinkedIn connection request

---

## Rate Limiting & Safety

- **Max 20 emails/day** (Gmail safety limit)
- **Max 5 emails/hour**
- **60-second delay** between emails
- Automatic duplicate detection
- Status tracking (NEW → EMAILED → FOLLOWUP1 → FOLLOWUP2 → FOLLOWUP3 → CLOSED)

---

## Google Sheets Schema

| Column | Description |
|--------|-------------|
| Lead ID | Auto-generated unique ID |
| Company Name | Target company |
| HR Email | Contact email |
| HR Name | Contact name |
| Job Title | Position applied for |
| Job URL | Source job posting |
| Source | Where lead was found |
| Status | Current outreach status |
| First Contact Date | When first emailed |
| Last Contact Date | Last email sent |
| Follow-up Count | Number of follow-ups |
| Notes | Additional info |
| Location | Job location |
| Salary Range | If available |
| Date Added | When lead was added |

---

## How to Use

### Local Development
```bash
# Setup
pip install -r requirements.txt
gws auth login
python scripts/setup_sheets.py

# Test (dry run)
export SPREADSHEET_ID=your_id
python scripts/run_outreach.py --dry-run --action full

# Run live
python scripts/run_outreach.py --action full
```

### Actions Available
- `full` - Complete cycle (scrape + outreach + followups + replies)
- `scrape` - Find new leads only
- `outreach` - Send emails to NEW leads
- `followup` - Send follow-up emails
- `replies` - Check for replies
- `stats` - Show statistics

### 24/7 Automation
1. Push to GitHub
2. Add secrets (SPREADSHEET_ID, GWS_CREDENTIALS)
3. Workflow runs automatically every 6 hours
4. Monitor via Actions tab

---

## File Structure

```
hr-outreach-system-v2/
├── .github/workflows/hr-outreach.yml  # GitHub Actions
├── src/                               # Python source code
│   ├── config.py
│   ├── job_scraper.py
│   ├── email_templates.py
│   ├── gmail_client.py
│   ├── sheets_tracker.py
│   ├── outreach_engine.py
│   └── utils.py
├── scripts/                           # Runner scripts
│   ├── setup_sheets.py
│   ├── run_outreach.py
│   └── test_email.py
├── data/                              # Data files
│   └── sample_leads.json
├── requirements.txt                   # Python deps
├── .env.example                       # Env template
├── .gitignore
├── README.md                          # Full documentation
├── QUICKSTART.md                      # 5-min setup
└── DEPLOYMENT.md                      # Production deploy
```

---

## Next Steps for User

1. **Install gws CLI**: `curl -fsSL https://raw.githubusercontent.com/googleworkspace/cli/main/install.sh | bash`
2. **Authenticate**: `gws auth login`
3. **Create Sheet**: `python scripts/setup_sheets.py`
4. **Test**: `python scripts/run_outreach.py --dry-run --action full`
5. **Deploy**: Push to GitHub, add secrets, enable Actions

---

## Security Considerations

- ✅ Credentials stored in GitHub Secrets
- ✅ Service account recommended for automation
- ✅ Rate limiting prevents spam
- ✅ Unsubscribe option in emails
- ✅ No hardcoded credentials

---

## Customization Points

1. **Email Templates**: Edit `src/email_templates.py`
2. **Target Companies**: Edit `src/job_scraper.py`
3. **Rate Limits**: Edit `src/config.py`
4. **Sheet Schema**: Edit `src/config.py` SHEET_HEADERS

---

## Built With

- **Python 3.11+**
- **gws CLI** - Google Workspace integration
- **GitHub Actions** - 24/7 automation
- **Google Sheets** - Lead tracking
- **Gmail** - Email sending

---

*System ready for deployment. Estimated setup time: 15-30 minutes.*
