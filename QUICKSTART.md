# Quick Start Guide

Get up and running in 5 minutes.

## 1. Install Dependencies

```bash
pip install -r requirements.txt
```

## 2. Install gws CLI

```bash
curl -fsSL https://raw.githubusercontent.com/googleworkspace/cli/main/install.sh | bash
```

## 3. Authenticate

```bash
gws auth login
# Follow the browser prompts
```

## 4. Create Tracking Sheet

```bash
python scripts/setup_sheets.py
# Save the Spreadsheet ID output
```

## 5. Test (Dry Run)

```bash
export SPREADSHEET_ID=your_id_here
python scripts/run_outreach.py --dry-run --action full
```

## 6. Run Live

```bash
python scripts/run_outreach.py --action full
```

## Commands

| Command | Description |
|---------|-------------|
| `python scripts/run_outreach.py --action full` | Run full cycle |
| `python scripts/run_outreach.py --action scrape` | Find new leads only |
| `python scripts/run_outreach.py --action outreach` | Send emails only |
| `python scripts/run_outreach.py --action followup` | Send follow-ups only |
| `python scripts/run_outreach.py --action stats` | Show statistics |
| `python scripts/run_outreach.py --dry-run` | Test without sending |

## Files to Customize

1. `src/email_templates.py` - Your email copy
2. `src/job_scraper.py` - Add your target companies
3. `src/config.py` - Adjust rate limits

## Need Help?

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup instructions.
