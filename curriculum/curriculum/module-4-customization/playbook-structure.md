# Playbook Structure - Module 4

## Overview

Learn to document, templatize, and standardize automation workflows as reusable playbooks for consistent delivery across teams and clients.

## What is a Playbook?

A **playbook** is a documented, reusable workflow template that includes:
- Step-by-step instructions
- Code examples and configurations
- Expected inputs and outputs
- Error handling procedures
- Success criteria and validation
- Business context and use cases

## Playbook Structure

### Standard Playbook Format

```markdown
# Playbook: [Name]

## Overview
Brief description of what this playbook accomplishes

## Business Value
- Agency value proposition
- Client outcomes
- ROI metrics

## Prerequisites
- Required credentials
- System access
- Environment setup

## Inputs
List of required and optional parameters

## Steps
Detailed workflow execution steps

## Outputs
Expected results and data format

## Error Handling
Common issues and resolutions

## Validation
How to verify success

## Examples
Real-world usage examples
```

### Playbook Example: LinkedIn Lead Generation

```markdown
# Playbook: LinkedIn Lead Generation

## Overview
Automated lead discovery and contact information extraction from LinkedIn Sales Navigator.

## Business Value
- **Agencies**: Deliver 500+ qualified leads per week to clients
- **Founders**: Build targeted prospect lists for outreach campaigns
- **ROI**: Save 20 hours/week on manual lead research

## Prerequisites
- LinkedIn Sales Navigator subscription
- Valid search criteria
- CRM or database for lead storage

## Inputs
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search_url | string | Yes | LinkedIn Sales Navigator search URL |
| max_results | number | No | Maximum leads to extract (default: 100) |
| filters | object | No | Additional search filters |
| output_format | string | No | CSV or JSON (default: JSON) |

## Workflow Definition

```json
{
  "name": "LinkedIn Lead Generation",
  "description": "Extract leads from LinkedIn Sales Navigator",
  "parameters": {
    "search_url": "string",
    "max_results": 100,
    "output_format": "json"
  },
  "definition": {
    "tasks": [
      {
        "name": "login_linkedin",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "https://www.linkedin.com/sales/login",
          "credentials": {
            "username": "${env.LINKEDIN_EMAIL}",
            "password": "${env.LINKEDIN_PASSWORD}"
          }
        }
      },
      {
        "name": "navigate_to_search",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {
          "url": "${params.search_url}"
        }
      },
      {
        "name": "extract_leads",
        "agent_type": "browser",
        "action": "evaluate",
        "parameters": {
          "script": "Array.from(document.querySelectorAll('.lead-card')).map(card => ({name: card.querySelector('.name').textContent, title: card.querySelector('.title').textContent, company: card.querySelector('.company').textContent}))"
        }
      },
      {
        "name": "save_to_database",
        "agent_type": "postgres",
        "action": "insert",
        "parameters": {
          "table": "leads",
          "data": "${extract_leads.result}"
        }
      },
      {
        "name": "export_results",
        "agent_type": "data",
        "action": "export",
        "parameters": {
          "format": "${params.output_format}",
          "data": "${extract_leads.result}"
        }
      }
    ]
  }
}
```

## Outputs

### Success Response
```json
{
  "status": "completed",
  "leads_found": 247,
  "leads_saved": 247,
  "execution_time": "4m 32s",
  "output_file": "/exports/leads-2024-11-19.json"
}
```

### Data Format
```json
[
  {
    "name": "John Smith",
    "title": "VP of Sales",
    "company": "Acme Corp",
    "location": "San Francisco, CA",
    "linkedin_url": "https://linkedin.com/in/johnsmith",
    "extracted_at": "2024-11-19T18:00:00Z"
  }
]
```

## Error Handling

### Common Errors

**LinkedIn Login Failed**
- **Cause**: Invalid credentials or 2FA required
- **Solution**: Verify credentials in .env, disable 2FA or use session cookies

**Rate Limit Exceeded**
- **Cause**: Too many requests in short time
- **Solution**: Add delays between requests, use LinkedIn API instead

**Element Not Found**
- **Cause**: LinkedIn UI changed
- **Solution**: Update selectors in workflow, use more robust XPath

## Validation

1. **Verify lead count** matches expected range
2. **Check data quality** - no null/empty fields
3. **Validate LinkedIn URLs** are properly formatted
4. **Confirm database insertion** was successful
5. **Test export file** can be opened and parsed

## Usage Examples

### Run Playbook via API
```bash
curl -X POST http://localhost:3000/api/v2/playbooks/linkedin-lead-gen/execute \
  -H "Authorization: ******" \
  -d '{
    "search_url": "https://www.linkedin.com/sales/search/...",
    "max_results": 500
  }'
```

### Schedule Daily Execution
```json
{
  "playbook": "linkedin-lead-gen",
  "schedule": "0 9 * * 1-5",
  "parameters": {
    "search_url": "${saved_search_url}",
    "max_results": 100
  }
}
```

## Success Metrics
- **Lead Quality**: 85%+ match target persona
- **Extraction Rate**: 95%+ of visible profiles captured
- **Error Rate**: <5% failed executions
- **Speed**: 50-100 leads per minute

---
```

## Playbook Template Library

### Template 1: E-Commerce Product Scraper

```yaml
name: E-Commerce Product Scraper
category: Data Extraction
difficulty: Beginner
estimated_time: 10 minutes

inputs:
  - name: product_url
    type: string
    required: true
    description: URL of product page
  
  - name: fields_to_extract
    type: array
    required: false
    default: ["title", "price", "description", "images"]

outputs:
  - name: product_data
    type: object
    schema:
      title: string
      price: number
      description: string
      images: array

workflow:
  - navigate to product_url
  - extract product fields
  - validate data completeness
  - save to database
  - return product_data
```

### Template 2: Social Media Scheduler

```yaml
name: Social Media Scheduler
category: Marketing Automation
difficulty: Intermediate
estimated_time: 5 minutes per post

inputs:
  - name: platform
    type: enum
    values: [twitter, linkedin, facebook]
    required: true
  
  - name: content
    type: object
    required: true
    schema:
      text: string
      images: array
      schedule_time: datetime

outputs:
  - name: post_id
    type: string
  - name: published_url
    type: string

workflow:
  - authenticate to platform
  - prepare media uploads
  - create scheduled post
  - verify scheduling
  - return post details
```

### Template 3: Website Health Monitor

```yaml
name: Website Health Monitor
category: Monitoring
difficulty: Beginner
estimated_time: 2 minutes

inputs:
  - name: urls
    type: array
    required: true
    description: List of URLs to monitor
  
  - name: checks
    type: array
    default: ["status_code", "load_time", "ssl_cert"]

outputs:
  - name: health_report
    type: object
    schema:
      url: string
      status: string
      response_time: number
      issues: array

workflow:
  - for each URL
    - navigate and measure load time
    - check HTTP status
    - validate SSL certificate
    - check for broken links
  - aggregate results
  - alert on failures
```

## Playbook Versioning

### Version Control Structure

```
playbooks/
├── linkedin-lead-gen/
│   ├── v1.0.0/
│   │   ├── playbook.md
│   │   ├── workflow.json
│   │   └── CHANGELOG.md
│   ├── v1.1.0/
│   │   ├── playbook.md
│   │   ├── workflow.json
│   │   └── CHANGELOG.md
│   └── latest -> v1.1.0
```

### Changelog Example

```markdown
# Changelog: LinkedIn Lead Generation Playbook

## [1.1.0] - 2024-11-15

### Added
- Support for CSV export format
- Email enrichment via Clearbit API
- Duplicate detection before saving

### Changed
- Updated LinkedIn selectors for new UI
- Improved error handling for rate limits

### Fixed
- Fixed pagination bug for searches >100 results

## [1.0.0] - 2024-10-01

### Added
- Initial release
- Basic lead extraction
- JSON export
```

## Playbook Catalog

### Organizing Playbooks

```typescript
// src/automation/playbooks/catalog.ts
export interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_time: string;
  version: string;
  author: string;
  tags: string[];
  inputs: PlaybookInput[];
  outputs: PlaybookOutput[];
  workflow: any;
}

export interface PlaybookInput {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: any;
}

export interface PlaybookOutput {
  name: string;
  type: string;
  description: string;
  schema?: any;
}

export class PlaybookCatalog {
  private playbooks: Map<string, Playbook> = new Map();
  
  registerPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.id, playbook);
  }
  
  getPlaybook(id: string): Playbook | undefined {
    return this.playbooks.get(id);
  }
  
  searchPlaybooks(query: {
    category?: string;
    difficulty?: string;
    tags?: string[];
  }): Playbook[] {
    return Array.from(this.playbooks.values()).filter(playbook => {
      if (query.category && playbook.category !== query.category) {
        return false;
      }
      if (query.difficulty && playbook.difficulty !== query.difficulty) {
        return false;
      }
      if (query.tags && !query.tags.some(tag => playbook.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  }
  
  listCategories(): string[] {
    const categories = new Set<string>();
    this.playbooks.forEach(p => categories.add(p.category));
    return Array.from(categories);
  }
}
```

## Documentation Standards

### README Template for Playbooks

```markdown
# [Playbook Name]

## Quick Start
```bash
# One-liner to execute playbook
curl -X POST http://localhost:3000/api/v2/playbooks/[id]/execute -d '{...}'
```

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Overview
[Description]

## Prerequisites
- [ ] Item 1
- [ ] Item 2

## Configuration
[Environment variables, credentials setup]

## Usage
[Detailed usage instructions]

## Examples
[Real-world examples with actual commands]

## Troubleshooting
[Common issues and solutions]

## FAQ
[Frequently asked questions]

## Support
For issues, contact: [support@example.com]

## License
[License information]
```

## Client Delivery Format

### Branded Playbook Package

```
client-playbook-package/
├── README.md                    # Quick start guide
├── playbooks/
│   ├── lead-generation.md       # Playbook documentation
│   ├── social-media.md
│   └── monitoring.md
├── workflows/
│   ├── lead-generation.json     # Workflow definitions
│   ├── social-media.json
│   └── monitoring.json
├── setup/
│   ├── .env.example             # Environment template
│   ├── install.sh               # Setup script
│   └── credentials-guide.md     # How to obtain credentials
├── examples/
│   ├── test-workflows.sh        # Test scripts
│   └── sample-data/
└── docs/
    ├── architecture.md
    ├── api-reference.md
    └── troubleshooting.md
```

### Client Handoff Checklist

```markdown
# Playbook Handoff Checklist

## Pre-Delivery
- [ ] All playbooks tested and working
- [ ] Documentation complete and reviewed
- [ ] Code examples validated
- [ ] Error messages are clear and actionable
- [ ] Success criteria defined

## Delivery Package
- [ ] Playbook documentation (PDF + Markdown)
- [ ] Workflow JSON files
- [ ] Setup scripts
- [ ] Test data and examples
- [ ] Video walkthrough (optional)

## Training
- [ ] Live walkthrough session scheduled
- [ ] Q&A document prepared
- [ ] Support contact provided
- [ ] Follow-up date scheduled

## Post-Delivery
- [ ] Client has successfully run all playbooks
- [ ] Credentials and access verified
- [ ] Monitoring and alerting configured
- [ ] Support SLA documented
```

## Playbook Monetization

### Pricing Models

**1. Per-Playbook Licensing**
- One-time fee: $500-$5,000 per playbook
- Includes: Documentation, workflow, support for 30 days

**2. Playbook Library Subscription**
- Monthly: $99-$999/month
- Includes: Access to all playbooks, updates, support

**3. Custom Playbook Development**
- Hourly rate: $150-$300/hour
- Fixed price: $3,000-$15,000 per custom playbook

**4. Enterprise Package**
- Annual: $25,000-$100,000/year
- Includes: Unlimited playbooks, custom development, dedicated support

## Business Impact

**For Agencies:**
- Standardize delivery across clients
- Reduce onboarding time by 75%
- Package knowledge for recurring revenue
- Scale without adding headcount

**For Founders:**
- Productize automation services
- Enable self-service for customers
- Create marketplace for playbooks
- Build community around playbooks

**For Platform Engineers:**
- Document tribal knowledge
- Ensure consistency across teams
- Enable non-technical users
- Reduce support burden

**For Senior Developers:**
- Share expertise through playbooks
- Reduce repetitive explanations
- Create reusable components
- Build personal brand

## Next Steps

✅ **Playbook structure mastered**

→ Proceed to [Module 5: Automation](../module-5-automation/README.md)

Learn workflow scheduling, monitoring, and production deployment.
