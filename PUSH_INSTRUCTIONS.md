# Push to GitHub

## Option 1: Using GitHub CLI (Recommended)
```bash
# Install gh if not already installed
brew install gh

# Authenticate
gh auth login

# Create repo and push
gh repo create mk-knight23/hr-outreach-system-v2 --public --source=. --push
```

## Option 2: Manual Steps
1. Go to https://github.com/new
2. Repository name: `hr-outreach-system-v2`
3. Set to Public
4. Click "Create repository"
5. Run these commands:

```bash
cd /Users/mkazi/.openclaw/workspace/hr-outreach-system-v2
git remote add origin https://github.com/mk-knight23/hr-outreach-system-v2.git
git branch -M main
git push -u origin main
```

## Option 3: Using GitHub Web Interface
1. Create repo on GitHub
2. Upload files via web interface
3. Or use GitHub Desktop

---

## After Push - Setup GitHub Actions

1. Go to repo Settings > Secrets and variables > Actions
2. Add these secrets:
   - `GWS_CLIENT_SECRET`: Your Google OAuth client_secret.json content
   - `GMAIL_USER`: mk.knight970@gmail.com

3. Enable GitHub Actions
4. First run will be manual - go to Actions tab and trigger workflow

## System is Ready! 🚀
