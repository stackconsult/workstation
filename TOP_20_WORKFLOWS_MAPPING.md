# Top 20 Workflow Templates - Comprehensive Mapping

## Overview
This document defines the top 20 workflow templates for the Workstation platform, split into two categories:
- **Top 10 GitHub Workflows**: Automation for software development, CI/CD, and repository management
- **Top 10 Business/Sales/Admin Workflows**: Automation for business operations, sales processes, and administrative tasks

Each workflow is mapped with:
- **ID**: Unique identifier
- **Name**: Display name
- **Category**: Classification (github, business, sales, admin)
- **Complexity**: Beginner, Intermediate, Advanced
- **Description**: What the workflow does
- **Use Cases**: Real-world scenarios
- **Node Flow**: Step-by-step automation sequence
- **Estimated Duration**: Expected runtime
- **Prerequisites**: Required setup/credentials
- **Outputs**: Expected results

---

## 🐙 Top 10 GitHub Workflows

### 1. Automated PR Review & Merge
**ID**: `github-pr-review-merge`  
**Category**: GitHub  
**Complexity**: Advanced  

**Description**: Automatically reviews pull requests, runs tests, checks code quality, and merges if all checks pass.

**Use Cases**:
- Automated dependency updates (Dependabot PRs)
- Team code review acceleration
- CI/CD pipeline integration

**Node Flow**:
1. **Trigger**: Webhook on PR creation/update
2. **Fetch PR**: Get PR details via GitHub API
3. **Run Checks**: Execute linting, tests, security scans
4. **Condition**: Check if all tests pass
5. **Review**: Post review comments with results
6. **Condition**: Check approval requirements
7. **Merge**: Auto-merge if approved
8. **Notify**: Send Slack/email notification
9. **End**

**Estimated Duration**: 5-15 minutes  
**Prerequisites**: GitHub token with repo access, webhook setup  
**Outputs**: Merged PR, test results, notifications

---

### 2. Issue Triage & Labeling
**ID**: `github-issue-triage`  
**Category**: GitHub  
**Complexity**: Intermediate  

**Description**: Automatically triages new issues by analyzing content, applying labels, assigning to team members, and prioritizing.

**Use Cases**:
- Bug report classification
- Feature request routing
- Support ticket assignment

**Node Flow**:
1. **Trigger**: New issue created
2. **Extract**: Parse issue title and body
3. **LLM Analysis**: Classify issue type (bug/feature/question)
4. **Label**: Apply appropriate labels
5. **Assign**: Route to relevant team member
6. **Priority**: Set priority based on keywords
7. **Comment**: Add triage template response
8. **Notify**: Alert assigned team member
9. **End**

**Estimated Duration**: 30-60 seconds  
**Prerequisites**: GitHub token, LLM API key (optional)  
**Outputs**: Labeled and assigned issue

---

### 3. Release Notes Generator
**ID**: `github-release-notes`  
**Category**: GitHub  
**Complexity**: Intermediate  

**Description**: Generates comprehensive release notes from commits, PRs, and issues between releases.

**Use Cases**:
- Automated changelog creation
- Version documentation
- Customer-facing release announcements

**Node Flow**:
1. **Input**: Get previous and current release tags
2. **Fetch Commits**: Get all commits between tags
3. **Fetch PRs**: Get merged PRs in range
4. **Categorize**: Group by type (features, fixes, breaking)
5. **Generate**: Create markdown release notes
6. **Format**: Apply template with sections
7. **Create Release**: Publish GitHub release
8. **Update Changelog**: Commit CHANGELOG.md
9. **Notify**: Post to discussion/Slack
10. **End**

**Estimated Duration**: 2-5 minutes  
**Prerequisites**: GitHub token with write access  
**Outputs**: GitHub release, CHANGELOG.md, notifications

---

### 4. Repository Health Check
**ID**: `github-repo-health`  
**Category**: GitHub  
**Complexity**: Beginner  

**Description**: Audits repository for best practices (README, LICENSE, CI, security, documentation).

**Use Cases**:
- Open source compliance
- Repository standardization
- Health score tracking

**Node Flow**:
1. **Start**
2. **Check README**: Verify existence and quality
3. **Check LICENSE**: Verify license file
4. **Check CI/CD**: Check workflows exist
5. **Check Security**: Review security.md, dependabot
6. **Check Docs**: Verify documentation folder
7. **Check Tests**: Check test coverage
8. **Score**: Calculate health score (0-100)
9. **Generate Report**: Create markdown report
10. **Create Issue**: File improvement suggestions
11. **End**

**Estimated Duration**: 1-2 minutes  
**Prerequisites**: GitHub token  
**Outputs**: Health report, issue with recommendations

---

### 5. Code Review Assistant
**ID**: `github-code-review-assistant`  
**Category**: GitHub  
**Complexity**: Advanced  

**Description**: AI-powered code review that checks for bugs, security issues, performance problems, and style violations.

**Use Cases**:
- Pre-merge code quality checks
- Security vulnerability detection
- Best practice enforcement

**Node Flow**:
1. **Trigger**: PR review requested
2. **Fetch Diff**: Get changed files
3. **Static Analysis**: Run linters and SAST tools
4. **LLM Review**: AI code analysis
5. **Security Scan**: Check for vulnerabilities
6. **Performance**: Identify bottlenecks
7. **Aggregate**: Combine all findings
8. **Post Comments**: Add inline PR comments
9. **Summary**: Post review summary
10. **Request Changes**: If issues found
11. **End**

**Estimated Duration**: 3-10 minutes  
**Prerequisites**: GitHub token, LLM API, security scanning tools  
**Outputs**: PR review comments, security report

---

### 6. Dependency Update Monitor
**ID**: `github-dependency-monitor`  
**Category**: GitHub  
**Complexity**: Intermediate  

**Description**: Monitors dependencies for updates, security vulnerabilities, and creates PRs with updates.

**Use Cases**:
- Security patch automation
- Dependency freshness
- Breaking change alerts

**Node Flow**:
1. **Start**
2. **Parse**: Read package.json/requirements.txt/etc
3. **Check Updates**: Query package registries
4. **Security Scan**: Check for CVEs
5. **Filter**: Categorize (patch, minor, major, security)
6. **Create Branch**: New branch for updates
7. **Update Files**: Modify dependency files
8. **Test**: Run automated tests
9. **Create PR**: Submit update PR
10. **Label**: Add priority labels
11. **End**

**Estimated Duration**: 5-15 minutes  
**Prerequisites**: GitHub token, package manager access  
**Outputs**: Update PRs, security report

---

### 7. Documentation Sync
**ID**: `github-docs-sync`  
**Category**: GitHub  
**Complexity**: Beginner  

**Description**: Keeps documentation in sync across README, wiki, GitHub Pages, and external docs sites.

**Use Cases**:
- Multi-platform documentation
- API reference updates
- README generation from code

**Node Flow**:
1. **Start**
2. **Fetch Source**: Get markdown files
3. **Parse Code**: Extract JSDoc/docstrings
4. **Generate API Docs**: Create API reference
5. **Update README**: Sync with docs/
6. **Update Wiki**: Push to GitHub wiki
7. **Build Site**: Generate static site
8. **Deploy**: Push to gh-pages
9. **Verify**: Check all links work
10. **End**

**Estimated Duration**: 2-5 minutes  
**Prerequisites**: GitHub token with wiki access  
**Outputs**: Synced documentation across platforms

---

### 8. Issue Stale Bot
**ID**: `github-stale-issues`  
**Category**: GitHub  
**Complexity**: Beginner  

**Description**: Identifies and closes stale issues/PRs that haven't had activity in specified timeframe.

**Use Cases**:
- Issue backlog cleanup
- Inactive PR management
- Contributor re-engagement

**Node Flow**:
1. **Start**
2. **Fetch Old Issues**: Get issues older than threshold
3. **Check Activity**: Verify no recent comments
4. **Exclude Labels**: Skip issues with specific labels
5. **Add Label**: Mark as stale
6. **Comment**: Warning comment with timeline
7. **Wait Period**: Check again after grace period
8. **Close**: Auto-close if still inactive
9. **Log**: Record closure statistics
10. **End**

**Estimated Duration**: 2-5 minutes  
**Prerequisites**: GitHub token  
**Outputs**: Labeled/closed stale issues

---

### 9. Multi-Repo Synchronization
**ID**: `github-multi-repo-sync`  
**Category**: GitHub  
**Complexity**: Advanced  

**Description**: Synchronizes files, workflows, or configurations across multiple repositories.

**Use Cases**:
- Organization-wide policy updates
- Shared workflow templates
- Configuration standardization

**Node Flow**:
1. **Input**: List of target repositories
2. **Fetch Source**: Get template files
3. **Loop Repos**: Iterate through each repo
4. **Clone**: Clone repository
5. **Create Branch**: New branch for changes
6. **Copy Files**: Update target files
7. **Commit**: Commit changes
8. **Push**: Push branch
9. **Create PR**: Submit PR for each repo
10. **Track**: Monitor PR status
11. **End**

**Estimated Duration**: 10-30 minutes (depends on repo count)  
**Prerequisites**: GitHub token with org access  
**Outputs**: PRs across multiple repos

---

### 10. Contributor Recognition
**ID**: `github-contributor-recognition`  
**Category**: GitHub  
**Complexity**: Intermediate  

**Description**: Tracks contributions, generates contributor statistics, and creates recognition posts.

**Use Cases**:
- Open source community building
- Monthly contributor highlights
- All-contributors badge management

**Node Flow**:
1. **Start**
2. **Fetch Contributors**: Get all contributors
3. **Count Contributions**: PRs, issues, reviews
4. **Calculate Stats**: Lines changed, impact score
5. **Generate Badges**: Create contributor badges
6. **Update README**: Add/update contributors section
7. **Create Post**: Monthly highlight post
8. **Tweet/Post**: Social media recognition (optional)
9. **Send Thanks**: Automated thank you messages
10. **End**

**Estimated Duration**: 3-7 minutes  
**Prerequisites**: GitHub token, social media API (optional)  
**Outputs**: Updated README, recognition posts

---

## 💼 Top 10 Business/Sales/Admin Workflows

### 11. Lead Generation from Website
**ID**: `business-lead-generation`  
**Category**: Sales  
**Complexity**: Intermediate  

**Description**: Scrapes target websites for leads, enriches data, and adds to CRM.

**Use Cases**:
- B2B prospecting
- Competitor analysis
- Market research

**Node Flow**:
1. **Start**
2. **Navigate**: Go to target website
3. **Search**: Use site search or directory
4. **Extract**: Scrape company names, emails, phones
5. **Paginate**: Loop through result pages
6. **Enrich**: Lookup additional data (LinkedIn, Clearbit)
7. **Validate**: Verify email addresses
8. **Deduplicate**: Remove existing leads
9. **Format**: Structure data for CRM
10. **Upload**: Add to CRM (Salesforce/HubSpot)
11. **Notify**: Alert sales team
12. **End**

**Estimated Duration**: 15-30 minutes  
**Prerequisites**: Target URLs, CRM API credentials  
**Outputs**: CSV of leads, CRM entries, notification

---

### 12. Invoice Processing & Payment Tracking
**ID**: `admin-invoice-processing`  
**Category**: Admin  
**Complexity**: Advanced  

**Description**: Extracts data from invoices (PDF/email), tracks payments, sends reminders.

**Use Cases**:
- Accounts payable automation
- Expense tracking
- Payment follow-up

**Node Flow**:
1. **Start**
2. **Fetch Emails**: Get emails with invoices
3. **Download Attachments**: Save PDF invoices
4. **Extract Data**: OCR invoice details (vendor, amount, due date)
5. **Validate**: Check against POs
6. **Upload**: Save to document management
7. **Create Record**: Add to accounting system
8. **Check Status**: Query payment status
9. **Send Reminders**: Email overdue payments
10. **Generate Report**: Payment status dashboard
11. **End**

**Estimated Duration**: 10-20 minutes  
**Prerequisites**: Email access, accounting system API  
**Outputs**: Processed invoices, payment report

---

### 13. Meeting Schedule & Preparation
**ID**: `admin-meeting-scheduler`  
**Category**: Admin  
**Complexity**: Intermediate  

**Description**: Finds available time slots, schedules meetings, sends invites, and prepares agendas.

**Use Cases**:
- Executive assistant automation
- Team coordination
- Client meeting booking

**Node Flow**:
1. **Input**: Meeting participants, duration
2. **Check Calendars**: Query all calendars
3. **Find Slots**: Identify common availability
4. **Select Best**: Choose optimal time
5. **Create Event**: Add to calendar
6. **Send Invites**: Email all participants
7. **Create Agenda**: Generate meeting doc
8. **Attach Materials**: Add relevant documents
9. **Set Reminders**: Schedule reminders
10. **End**

**Estimated Duration**: 2-5 minutes  
**Prerequisites**: Google Calendar/Outlook API  
**Outputs**: Calendar event, meeting agenda

---

### 14. Customer Feedback Analysis
**ID**: `business-feedback-analysis`  
**Category**: Business  
**Complexity**: Advanced  

**Description**: Collects customer feedback from multiple sources, analyzes sentiment, identifies trends.

**Use Cases**:
- Product improvement insights
- Customer satisfaction tracking
- Support ticket analysis

**Node Flow**:
1. **Start**
2. **Fetch Reviews**: Get from app stores, G2, Trustpilot
3. **Fetch Surveys**: Pull survey responses
4. **Fetch Support**: Get support tickets
5. **Aggregate**: Combine all feedback
6. **LLM Analysis**: Extract themes and sentiment
7. **Categorize**: Group by topic (bugs, features, praise)
8. **Score**: Calculate satisfaction scores
9. **Generate Insights**: Create summary report
10. **Create Tasks**: File issues for top problems
11. **Share Report**: Email to stakeholders
12. **End**

**Estimated Duration**: 10-25 minutes  
**Prerequisites**: Review platform APIs, LLM access  
**Outputs**: Sentiment report, issue tracker tasks

---

### 15. Expense Report Compilation
**ID**: `admin-expense-reports`  
**Category**: Admin  
**Complexity**: Intermediate  

**Description**: Gathers receipts from email/photos, extracts data, categorizes, and creates expense reports.

**Use Cases**:
- Employee expense reimbursement
- Travel expense tracking
- Tax documentation

**Node Flow**:
1. **Start**
2. **Fetch Receipts**: Get from email/cloud storage
3. **OCR**: Extract text from images/PDFs
4. **Parse**: Get vendor, amount, date, category
5. **Categorize**: Apply expense categories
6. **Currency Convert**: Standardize to home currency
7. **Validate**: Check policy compliance
8. **Flag**: Highlight anomalies
9. **Generate Report**: Create expense report
10. **Submit**: Send for approval
11. **Export**: Download as PDF/Excel
12. **End**

**Estimated Duration**: 5-15 minutes  
**Prerequisites**: Email/storage access, OCR service  
**Outputs**: Expense report PDF, approval request

---

### 16. Competitor Price Monitoring
**ID**: `sales-competitor-pricing`  
**Category**: Sales  
**Complexity**: Intermediate  

**Description**: Monitors competitor websites for pricing changes, compares to your pricing, alerts on changes.

**Use Cases**:
- Dynamic pricing strategy
- Market positioning
- Promotion detection

**Node Flow**:
1. **Start**
2. **Navigate**: Go to competitor sites
3. **Extract Prices**: Scrape product prices
4. **Compare**: Check against historical data
5. **Calculate**: Price difference percentages
6. **Detect Changes**: Identify price drops/increases
7. **Compare Yours**: Check your pricing
8. **Generate Alert**: Create notification if significant change
9. **Update Database**: Store new prices
10. **Create Report**: Price comparison dashboard
11. **Send Email**: Alert sales/pricing team
12. **End**

**Estimated Duration**: 10-20 minutes  
**Prerequisites**: Competitor URLs, database access  
**Outputs**: Price comparison report, alerts

---

### 17. Social Media Content Scheduler
**ID**: `business-social-scheduler`  
**Category**: Business  
**Complexity**: Intermediate  

**Description**: Schedules and posts content across multiple social platforms with optimal timing.

**Use Cases**:
- Content marketing automation
- Multi-platform posting
- Engagement optimization

**Node Flow**:
1. **Input**: Content and target platforms
2. **Analyze**: Best posting times per platform
3. **Customize**: Adapt content for each platform
4. **Resize Images**: Optimize for platform specs
5. **Add Hashtags**: Generate relevant hashtags
6. **Schedule**: Queue posts at optimal times
7. **Post**: Publish to each platform
8. **Monitor**: Track engagement
9. **Log**: Record post performance
10. **Report**: Weekly analytics summary
11. **End**

**Estimated Duration**: 5-10 minutes per batch  
**Prerequisites**: Social media API access (Twitter, LinkedIn, Facebook)  
**Outputs**: Published posts, analytics report

---

### 18. Contract Review & Tracking
**ID**: `admin-contract-management`  
**Category**: Admin  
**Complexity**: Advanced  

**Description**: Extracts key terms from contracts, tracks renewal dates, sends alerts before expiration.

**Use Cases**:
- Vendor contract management
- SaaS subscription tracking
- Renewal negotiation prep

**Node Flow**:
1. **Start**
2. **Fetch Contracts**: Get from document management
3. **Extract Text**: PDF parsing
4. **LLM Analysis**: Extract key terms (dates, amounts, clauses)
5. **Store Data**: Add to contract database
6. **Calculate**: Days until renewal/expiration
7. **Check Alerts**: Flag contracts expiring soon
8. **Generate Summary**: Contract overview report
9. **Send Reminders**: Email stakeholders
10. **Create Tasks**: Assign renewal actions
11. **End**

**Estimated Duration**: 5-15 minutes per contract  
**Prerequisites**: Document storage access, LLM API  
**Outputs**: Contract database, renewal alerts

---

### 19. Email Campaign Performance Tracker
**ID**: `sales-email-analytics`  
**Category**: Sales  
**Complexity**: Beginner  

**Description**: Pulls email campaign data, analyzes open/click rates, identifies best performers.

**Use Cases**:
- Email marketing optimization
- A/B test analysis
- Campaign ROI tracking

**Node Flow**:
1. **Start**
2. **Fetch Campaigns**: Get from email platform (Mailchimp, SendGrid)
3. **Extract Metrics**: Open rate, click rate, conversions
4. **Calculate**: ROI, engagement scores
5. **Compare**: Benchmark against previous campaigns
6. **Identify**: Best subject lines and content
7. **Segment Analysis**: Performance by audience segment
8. **Visualize**: Create charts and graphs
9. **Generate Report**: Campaign performance summary
10. **Share**: Email to marketing team
11. **End**

**Estimated Duration**: 3-7 minutes  
**Prerequisites**: Email platform API  
**Outputs**: Performance dashboard, insights report

---

### 20. Employee Onboarding Automation
**ID**: `admin-employee-onboarding`  
**Category**: Admin  
**Complexity**: Advanced  

**Description**: Automates new hire onboarding: accounts, access, training, documentation, welcome messages.

**Use Cases**:
- HR automation
- IT provisioning
- Onboarding consistency

**Node Flow**:
1. **Trigger**: New hire in HRIS
2. **Create Accounts**: Email, Slack, GitHub, etc.
3. **Assign Groups**: Add to teams/distribution lists
4. **Provision Access**: Grant app/system permissions
5. **Send Hardware**: Order laptop/equipment
6. **Create Docs**: Generate offer letter, handbook
7. **Schedule Training**: Enroll in courses
8. **Assign Buddy**: Match with onboarding buddy
9. **Create Checklist**: 30/60/90 day tasks
10. **Send Welcome**: Automated welcome email
11. **Track Progress**: Monitor onboarding completion
12. **End**

**Estimated Duration**: 15-30 minutes  
**Prerequisites**: HRIS API, IT system APIs  
**Outputs**: Created accounts, onboarding checklist, notifications

---

## Implementation Priority

### Phase 1 (MVP - 5 workflows)
1. **GitHub PR Review & Merge** - High demand from dev teams
2. **Lead Generation from Website** - Direct revenue impact
3. **Issue Triage & Labeling** - Reduces manual triage time
4. **Meeting Schedule & Preparation** - Universal business need
5. **Competitor Price Monitoring** - Competitive intelligence

### Phase 2 (Growth - 8 workflows)
6. **Code Review Assistant** - AI-powered quality checks
7. **Invoice Processing & Payment Tracking** - Admin efficiency
8. **Customer Feedback Analysis** - Product insights
9. **Social Media Content Scheduler** - Marketing automation
10. **Release Notes Generator** - Dev productivity
11. **Expense Report Compilation** - Employee satisfaction
12. **Repository Health Check** - OSS compliance
13. **Email Campaign Performance Tracker** - Marketing ROI

### Phase 3 (Advanced - 7 workflows)
14. **Dependency Update Monitor** - Security & maintenance
15. **Contract Review & Tracking** - Legal/admin automation
16. **Documentation Sync** - Multi-platform docs
17. **Employee Onboarding Automation** - HR scaling
18. **Multi-Repo Synchronization** - Enterprise git ops
19. **Issue Stale Bot** - Repo maintenance
20. **Contributor Recognition** - Community building

---

## Technical Architecture

### Template Storage Structure
```
src/workflow-templates/
├── github/
│   ├── pr-review-merge.json
│   ├── issue-triage.json
│   ├── release-notes.json
│   ├── repo-health.json
│   ├── code-review-assistant.json
│   ├── dependency-monitor.json
│   ├── docs-sync.json
│   ├── stale-issues.json
│   ├── multi-repo-sync.json
│   └── contributor-recognition.json
├── business/
│   ├── lead-generation.json
│   ├── feedback-analysis.json
│   └── social-scheduler.json
├── sales/
│   ├── competitor-pricing.json
│   └── email-analytics.json
└── admin/
    ├── invoice-processing.json
    ├── meeting-scheduler.json
    ├── expense-reports.json
    ├── contract-management.json
    └── employee-onboarding.json
```

### Required Integrations
- **GitHub API**: All GitHub workflows
- **CRM APIs**: Salesforce, HubSpot for sales workflows
- **Email APIs**: Gmail, Outlook for admin workflows
- **Calendar APIs**: Google Calendar, Outlook for scheduling
- **LLM APIs**: OpenAI, Anthropic for AI-powered analysis
- **Social Media APIs**: Twitter, LinkedIn, Facebook
- **Accounting APIs**: QuickBooks, Xero for financial workflows

### Node Type Mapping
Each workflow will use existing node types from the workflow builder plus new integration nodes:
- **GitHub nodes**: github_api, github_webhook, github_create_pr
- **CRM nodes**: crm_create_lead, crm_update_record, crm_search
- **Email nodes**: email_fetch, email_send, email_parse
- **Calendar nodes**: calendar_create, calendar_find_slots
- **LLM nodes**: llm_analyze, llm_categorize, llm_extract
- **OCR nodes**: ocr_extract, pdf_parse

---

## Next Steps

1. **Review & Approval**: Stakeholder review of workflow definitions
2. **Prioritization**: Confirm implementation order (Phase 1-3)
3. **Node Development**: Create missing integration nodes
4. **Template Coding**: Implement each workflow as JSON template
5. **Testing**: Validate each workflow with real data
6. **Documentation**: Create user guides for each template
7. **Training**: Prepare training materials and demos
8. **Deployment**: Roll out in phases with user feedback

---

## Success Metrics

- **Adoption Rate**: % of users using templates
- **Time Savings**: Avg time saved per workflow execution
- **Error Rate**: % of successful executions
- **Customization Rate**: % of users modifying templates
- **Top Performers**: Most-used workflows
- **User Satisfaction**: NPS score for template users

---

*Document Version: 1.0*  
*Last Updated: 2025-11-21*  
*Status: Ready for Review*
