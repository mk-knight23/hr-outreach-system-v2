# HR Outreach Automation Engine

A comprehensive TypeScript-based HR outreach automation system with email engine (GWS CLI integration), contact database (SQLite), dynamic templates with skill matching, intelligent scheduling, and analytics tracking.

## Features

- **📧 Email Engine**: Send emails via Google Workspace (gws CLI) with rate limiting and batch processing
- **👥 Contact Database**: SQLite-based contact management with skill-based filtering
- **📝 Dynamic Templates**: Skill-matched email templates with variable substitution
- **⏰ Smart Scheduler**: Optimal send time calculation based on historical data
- **📊 Analytics Tracker**: Comprehensive campaign metrics and engagement tracking

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Initialize the database
npm run db:init

# Or use the CLI
node dist/cli.js init
```

## Usage

### Basic Usage

```typescript
import { CampaignManager, initializeSystem } from './dist/index.js';

// Initialize
await initializeSystem();

// Create manager
const manager = new CampaignManager();

// Import contacts
const contacts = await manager.importContacts([
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    skills: ['JavaScript', 'React', 'Node.js'],
    experienceYears: 5,
    source: 'linkedin',
    status: 'new',
    priority: 'high'
  }
]);

// Create templates
const template = await manager.createTemplate({
  name: 'Engineering Outreach',
  subject: 'Exciting opportunity at {{companyName}}',
  body: `Hi {{firstName}},

I noticed your experience with {{skills}}...`,
  type: 'initial',
  requiredSkills: ['JavaScript', 'React'],
  tone: 'casual',
  placeholders: ['firstName', 'skills', 'companyName']
});

// Send emails
const result = await manager.sendToContacts(
  [contactId],
  template.id,
  {
    senderName: 'Jane Smith',
    senderTitle: 'Talent Acquisition',
    companyName: 'Tech Corp',
    jobTitle: 'Senior Engineer'
  }
);
```

### CLI Usage

```bash
# List contacts
node dist/cli.js contacts:list --status new --skills "JavaScript,React"

# Show contact statistics
node dist/cli.js contacts:stats

# List templates
node dist/cli.js templates:list

# Create default templates
node dist/cli.js templates:defaults

# Create a campaign
node dist/cli.js campaign:create \
  --name "Senior Engineers Q1" \
  --skills "Python,Machine Learning" \
  --daily-limit 50

# Process scheduled emails
node dist/cli.js send:scheduled --batch-size 10

# View analytics
node dist/cli.js analytics:dashboard
```

## Project Structure

```
hr-outreach-system-v2/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── database/        # SQLite database and repositories
│   │   ├── init.ts      # Database initialization
│   │   └── contacts.ts  # Contact repository
│   ├── email/           # Email engine
│   │   ├── engine.ts    # GWS CLI integration
│   │   └── logRepository.ts
│   ├── templates/       # Template engine
│   │   └── engine.ts    # Skill matching & rendering
│   ├── scheduler/       # Scheduling engine
│   │   └── engine.ts    # Optimal send time calculation
│   ├── analytics/       # Analytics tracking
│   │   └── tracker.ts   # Metrics & reporting
│   ├── utils/           # Utility functions
│   ├── campaignManager.ts  # Main orchestrator
│   ├── cli.ts           # CLI interface
│   └── index.ts         # Main exports
├── config/              # Configuration files
├── data/                # SQLite database (created at runtime)
├── package.json
└── tsconfig.json
```

## Database Schema

### Tables

- **contacts** - Candidate information with skills and status
- **email_templates** - Reusable email templates with skill matching
- **email_campaigns** - Campaign configuration and targeting
- **email_logs** - Email send history and tracking
- **scheduled_emails** - Pending scheduled sends
- **analytics** - Daily aggregated metrics
- **send_time_optimization** - Hourly performance data

## Template Variables

Available placeholders for email templates:

| Variable | Description |
|----------|-------------|
| `{{firstName}}` | Contact's first name |
| `{{lastName}}` | Contact's last name |
| `{{fullName}}` | Full name |
| `{{email}}` | Email address |
| `{{company}}` | Current company |
| `{{title}}` | Job title |
| `{{location}}` | Location |
| `{{experienceYears}}` | Years of experience |
| `{{skills}}` | Comma-separated skills |
| `{{senderName}}` | Your name |
| `{{senderTitle}}` | Your title |
| `{{companyName}}` | Hiring company |
| `{{jobTitle}}` | Position |
| `{{jobDescription}}` | Job description |

## API Reference

### CampaignManager

Main orchestrator class that ties all components together.

```typescript
class CampaignManager {
  // Contacts
  importContacts(contacts): Contact[]
  findContacts(filters): Contact[]
  
  // Templates
  createTemplate(template): EmailTemplate
  getBestTemplateForContact(contact): EmailTemplate | null
  setupDefaultTemplates(): EmailTemplate[]
  
  // Campaigns
  createCampaign(config): { campaignId, contactsCount, scheduledCount }
  
  // Sending
  sendToContacts(contactIds, templateId, variables, options): Promise<results>
  processScheduledEmails(batchSize): Promise<{ processed, successful, failed }>
  
  // Analytics
  getDashboardSummary(): DashboardSummary
  getCampaignSummary(campaignId?): CampaignSummary
  getTrends(days?): TrendData[]
}
```

## Configuration

### GWS CLI Setup

Ensure `gws` CLI is installed and configured:

```bash
# Verify GWS is available
gws --version

# Configure profile (if needed)
gws auth login --profile default
```

### Environment Variables

Optional environment variables:

```bash
# Database path (default: ./data/hr_outreach.db)
DB_PATH=/path/to/database.db

# GWS CLI profile
GWS_PROFILE=default

# Default timezone
DEFAULT_TIMEZONE=America/New_York
```

## License

MIT
