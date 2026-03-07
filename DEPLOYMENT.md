# 🚀 Deployment Guide

Complete guide to deploying the HR Outreach System for 24/7 automated operation.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Google Cloud Setup](#google-cloud-setup)
4. [GitHub Actions Deployment](#github-actions-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

- Python 3.11+
- Google Account with Gmail access
- GitHub account (for 24/7 automation)
- gws CLI installed

---

## Local Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hr-outreach-system-v2
pip install -r requirements.txt
```

### 2. Install gws CLI

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/googleworkspace/cli/main/install.sh | bash

# Verify installation
gws --version
```

### 3. Authenticate with Google

```bash
# Interactive authentication (for local use)
gws auth login

# This opens a browser - follow the OAuth flow
```

### 4. Initialize Tracking Spreadsheet

```bash
python scripts/setup_sheets.py
```

This creates a Google Sheet and outputs the Spreadsheet ID. Save this!

### 5. Test the System (Dry Run)

```bash
# Test without sending emails
python scripts/run_outreach.py --dry-run --action full

# Check statistics
python scripts/run_outreach.py --action stats
```

### 6. Run Live (First Time)

```bash
export SPREADSHEET_ID=your_spreadsheet_id_here
python scripts/run_outreach.py --action full
```

---

## Google Cloud Setup

For 24/7 automation, you need a Service Account (non-interactive auth).

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable APIs:
   - Gmail API
   - Google Sheets API
   - Google Drive API

### 2. Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Name: `hr-outreach-automation`
4. Grant roles:
   - Gmail API User
   - Sheets API User
   - Drive API User

### 3. Create and Download Key

1. Select your service account
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Choose **JSON**
5. Download the file (keep it secure!)

### 4. Share Resources with Service Account

**For Gmail:**
- Service accounts can't directly access Gmail
- You need to use domain-wide delegation (Google Workspace required)
- OR use personal access tokens for personal Gmail

**For Google Sheets:**
1. Open your tracking spreadsheet
2. Click **Share**
3. Add the service account email (from the JSON file)
4. Grant **Editor** access

### 5. Base64 Encode Credentials (for GitHub)

```bash
# On macOS/Linux
cat your-service-account.json | base64 | pbcopy

# On Linux (without pbcopy)
cat your-service-account.json | base64

# Copy the output for GitHub secret
```

---

## GitHub Actions Deployment

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hr-outreach-system.git
git push -u origin main
```

### 2. Add Repository Secrets

Go to **Settings > Secrets and variables > Actions**

Add these secrets:

| Secret | Value |
|--------|-------|
| `SPREADSHEET_ID` | Your Google Sheet ID |
| `GWS_CREDENTIALS` | Base64-encoded service account JSON |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook for notifications |

### 3. Verify Workflow

1. Go to **Actions** tab
2. You should see the "HR Outreach Automation" workflow
3. Click **Run workflow** to test manually

### 4. Monitor Runs

- Workflow runs every 6 hours automatically
- Check the Actions tab for run history
- Download artifacts for logs

---

## Gmail Authentication for Automation

**Important:** Service accounts have limitations with Gmail. Here are workarounds:

### Option 1: Google Workspace (Recommended)
If you have Google Workspace:
1. Enable domain-wide delegation for the service account
2. Impersonate your email address

### Option 2: OAuth Refresh Token
1. Get a refresh token using interactive auth
2. Store it as a secret
3. Use it in GitHub Actions

### Option 3: App Password (Personal Gmail)
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use with a modified auth approach

---

## Monitoring & Maintenance

### Check Lead Status

```bash
python scripts/run_outreach.py --action stats
```

### View Google Sheet

Open your spreadsheet to see:
- All leads and their status
- Sent dates
- Follow-up tracking

### GitHub Actions Logs

1. Go to Actions tab
2. Click on a workflow run
3. View logs for each step

### Common Issues

**Issue: "gws not found"**
```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
```

**Issue: "Permission denied"**
- Check service account has access to Sheet
- Verify Gmail API is enabled
- For Gmail, ensure proper delegation

**Issue: Rate limiting**
- System automatically limits to 20 emails/day
- Check config.py to adjust limits

---

## Updating the System

### Add New Job Sources

Edit `src/job_scraper.py` and add to `get_sample_leads()` or implement scrapers.

### Modify Email Templates

Edit `src/email_templates.py` to customize your outreach.

### Update Schedule

Edit `.github/workflows/hr-outreach.yml`:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 9 * * *'   # Daily at 9 AM
```

---

## Security Best Practices

1. **Never commit credentials** - Use GitHub Secrets
2. **Rotate service account keys** - Every 90 days
3. **Monitor sent emails** - Check Gmail sent folder
4. **Review leads regularly** - Remove unwanted companies
5. **Use dry-run first** - Test changes before live deployment

---

## Support

- gws CLI docs: https://github.com/googleworkspace/cli
- GitHub Actions docs: https://docs.github.com/en/actions
- Google Workspace API docs: https://developers.google.com/workspace

---

## Next Steps

1. ✅ Complete local setup
2. ✅ Test with --dry-run
3. ✅ Create Google Cloud project
4. ✅ Set up service account
5. ✅ Deploy to GitHub
6. ✅ Monitor first few runs
7. ✅ Iterate and improve
