# Workspace Initialization System

## Overview

Production-ready workspace initialization system that creates 20 pre-configured workspaces with graceful degradation, idempotent execution, and comprehensive error handling.

## Features

- ✅ **20 Pre-configured Workspaces**: Ready-to-use workspaces for different use cases
- ✅ **Database Availability Checking**: Graceful degradation if database is unavailable
- ✅ **Idempotent**: Safe to run multiple times without duplicates
- ✅ **PostgreSQL Support**: Full PostgreSQL integration with proper schema
- ✅ **Automatic Initialization**: Runs on server startup with status checks
- ✅ **Manual Script**: Can be run separately for manual initialization
- ✅ **Progress Reporting**: Detailed statistics and error reporting
- ✅ **Comprehensive Logging**: Winston logging for debugging

## Workspace Categories

### 1. Automation Workspaces
- **Web Automation**: Browser automation and web scraping workflows
- **Email Automation**: Email sending, parsing, and automation
- **Content Generation**: AI-powered content creation workflows
- **Marketing Automation**: Marketing campaign and lead generation

### 2. Data Workspaces
- **Data Processing**: ETL pipelines and data transformation
- **File Management**: File upload, download, and processing
- **Database Operations**: Database queries, migrations, and backups
- **Analytics & Reporting**: Data analytics and report generation
- **Video Processing**: Video upload, encoding, and streaming

### 3. Integration Workspaces
- **API Integration**: REST API and webhook integration
- **Social Media**: Social media posting and monitoring
- **Slack Integration**: Slack bot and notification workflows
- **E-commerce**: E-commerce order processing and inventory
- **Customer Support**: Customer support ticket and chat workflows
- **IoT & Sensors**: IoT device and sensor data workflows

### 4. Monitoring Workspaces
- **Monitoring & Alerts**: System monitoring and alerting
- **Security Scanning**: Security vulnerability scanning
- **Compliance & Audit**: Compliance checking and audit trail

### 5. Development Workspaces
- **CI/CD Pipeline**: Continuous integration and deployment
- **GitHub Automation**: GitHub PR, issue, and deployment automation

## Architecture

### Components

```
src/
├── services/
│   └── workspace-initialization.ts   # Core initialization service
├── scripts/
│   └── initialize-workspaces.ts      # Manual initialization script
└── db/
    └── schema.sql                    # Database schema (includes workspaces table)
```

### Database Schema

**Table: `workspaces`**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50),                    -- automation, data, integration, monitoring, development
  features TEXT[],                     -- Array of feature names
  default_tools TEXT[],                -- Array of default tool names
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Installation & Setup

### 1. Automatic Initialization (On Server Startup)

The workspace initialization runs automatically when the server starts:

```bash
npm run build
npm start
```

**What happens:**
1. Server checks database availability
2. If database available, checks if workspaces table exists
3. If table exists, checks workspace count
4. If workspaces missing, initializes them
5. Logs detailed status information

**Log Output:**
```
Phase 6: Workspaces already initialized { count: 20, expected: 20 }
```

or

```
Phase 6: Workspaces initialized successfully { stats: { total: 20, created: 20, skipped: 0, failed: 0 } }
```

### 2. Manual Initialization

Run the initialization script manually:

```bash
# Build first
npm run build

# Run script
node dist/scripts/initialize-workspaces.js

# Or with ts-node (development)
npx ts-node src/scripts/initialize-workspaces.ts
```

**Script Output:**
```
============================================================
Workspace Initialization Script
============================================================

Checking current workspace status...

Current Status:
  Database Available: ✓
  Workspaces Table: ✓
  Existing Workspaces: 0 / 20

Starting workspace initialization...

============================================================
Initialization Results:
============================================================
  Status: ✓ SUCCESS
  Message: Initialized 20 workspaces (0 already existed, 0 failed)

Statistics:
  Total Workspaces: 20
  Created: 20
  Already Existed: 0
  Failed: 0
============================================================

✓ Workspace initialization completed successfully
```

## Workspace Definitions

### Complete List

| # | Name | Slug | Type | Description |
|---|------|------|------|-------------|
| 1 | Web Automation | web-automation | automation | Browser automation and web scraping workflows |
| 2 | Data Processing | data-processing | data | ETL pipelines and data transformation workflows |
| 3 | API Integration | api-integration | integration | REST API and webhook integration workflows |
| 4 | Email Automation | email-automation | automation | Email sending, parsing, and automation workflows |
| 5 | Social Media | social-media | integration | Social media posting and monitoring workflows |
| 6 | File Management | file-management | data | File upload, download, and processing workflows |
| 7 | Database Operations | database-ops | data | Database queries, migrations, and backups |
| 8 | CI/CD Pipeline | cicd-pipeline | development | Continuous integration and deployment workflows |
| 9 | Monitoring & Alerts | monitoring-alerts | monitoring | System monitoring and alerting workflows |
| 10 | Slack Integration | slack-integration | integration | Slack bot and notification workflows |
| 11 | GitHub Automation | github-automation | development | GitHub PR, issue, and deployment automation |
| 12 | Content Generation | content-generation | automation | AI-powered content creation workflows |
| 13 | E-commerce | ecommerce | integration | E-commerce order processing and inventory workflows |
| 14 | Analytics & Reporting | analytics-reporting | data | Data analytics and report generation workflows |
| 15 | Security Scanning | security-scanning | monitoring | Security vulnerability scanning workflows |
| 16 | Customer Support | customer-support | integration | Customer support ticket and chat workflows |
| 17 | Marketing Automation | marketing-automation | automation | Marketing campaign and lead generation workflows |
| 18 | Video Processing | video-processing | data | Video upload, encoding, and streaming workflows |
| 19 | IoT & Sensors | iot-sensors | integration | IoT device and sensor data workflows |
| 20 | Compliance & Audit | compliance-audit | monitoring | Compliance checking and audit trail workflows |

### Features by Workspace

Each workspace includes specific features and default tools:

**Example: Web Automation**
- Features: `['playwright', 'form-filling', 'data-extraction', 'screenshots']`
- Default Tools: `['browser-manager', 'form-filler', 'data-extractor']`

**Example: API Integration**
- Features: `['rest-api', 'webhooks', 'oauth', 'rate-limiting']`
- Default Tools: `['http-client', 'webhook-handler', 'oauth-manager']`

## API Usage

### Check Initialization Status

```typescript
import { getWorkspaceInitializationStatus } from './services/workspace-initialization';

const status = await getWorkspaceInitializationStatus();

console.log(status);
// {
//   databaseAvailable: true,
//   tableExists: true,
//   workspaceCount: 20,
//   expectedCount: 20
// }
```

### Initialize Workspaces Programmatically

```typescript
import { initializeWorkspaces } from './services/workspace-initialization';

const result = await initializeWorkspaces();

console.log(result);
// {
//   success: true,
//   message: "Initialized 20 workspaces (0 already existed, 0 failed)",
//   stats: {
//     total: 20,
//     created: 20,
//     skipped: 0,
//     failed: 0
//   }
// }
```

## Error Handling

### Graceful Degradation

**Scenario 1: Database Not Available**
```
✗ Database not available
→ Skip workspace initialization
→ Log warning
→ Server continues to start
```

**Scenario 2: Workspaces Table Missing**
```
✓ Database available
✗ Workspaces table missing
→ Create workspaces table
→ Initialize all workspaces
→ Log success
```

**Scenario 3: Partial Initialization**
```
✓ Database available
✓ Table exists
⚠ Only 10 of 20 workspaces exist
→ Initialize missing 10 workspaces
→ Skip existing 10 workspaces
→ Log statistics
```

### Error Scenarios

| Scenario | Behavior | Log Level |
|----------|----------|-----------|
| Database unavailable | Skip initialization | WARN |
| Table creation failed | Throw error | ERROR |
| Workspace creation failed | Continue with others | WARN |
| All workspaces failed | Report failure | ERROR |
| Partial success | Report statistics | INFO |

## Monitoring & Debugging

### Log Levels

**INFO:** Normal operations
```
Starting workspace initialization { totalWorkspaces: 20 }
Workspace created successfully { name: 'Web Automation', slug: 'web-automation' }
Workspace initialization completed { stats: {...} }
```

**DEBUG:** Detailed operations
```
Workspace already exists, skipping { slug: 'web-automation' }
```

**WARN:** Non-critical issues
```
Database not available, skipping workspace initialization
```

**ERROR:** Critical failures
```
Failed to insert workspace { error, workspace: 'Web Automation' }
Workspace initialization failed { error, stats }
```

### Database Queries

**Check workspace count:**
```sql
SELECT COUNT(*) FROM workspaces;
```

**List all workspaces:**
```sql
SELECT name, slug, type, is_active 
FROM workspaces 
ORDER BY name;
```

**Check workspace by slug:**
```sql
SELECT * FROM workspaces WHERE slug = 'web-automation';
```

**Get workspaces by type:**
```sql
SELECT name, slug, description 
FROM workspaces 
WHERE type = 'automation' 
ORDER BY name;
```

## Troubleshooting

### Issue: Workspaces not initializing

**Symptoms:** Server starts but no workspaces created

**Diagnosis:**
```bash
# Check database connection
psql -U postgres -d workstation_saas -c "SELECT 1;"

# Check workspaces table
psql -U postgres -d workstation_saas -c "\dt workspaces"

# Check logs
tail -f logs/combined.log | grep "workspace"
```

**Solutions:**
1. Verify database connection in .env
2. Run migration to create workspaces table
3. Check database user permissions
4. Run manual initialization script

### Issue: Duplicate key errors

**Symptoms:** Errors about unique constraint violations

**Diagnosis:**
```sql
SELECT slug, COUNT(*) 
FROM workspaces 
GROUP BY slug 
HAVING COUNT(*) > 1;
```

**Solution:**
This shouldn't happen due to `ON CONFLICT (slug) DO NOTHING`, but if it does:
```sql
-- Delete duplicates keeping oldest
DELETE FROM workspaces a USING workspaces b
WHERE a.slug = b.slug AND a.created_at > b.created_at;
```

### Issue: Missing workspaces table

**Symptoms:** Error "relation workspaces does not exist"

**Solution:**
```bash
# Run database migration
psql -U postgres -d workstation_saas -f src/db/schema.sql

# Or let the service create it automatically
# (it will create the table if missing)
```

## Customization

### Adding New Workspaces

Edit `src/services/workspace-initialization.ts`:

```typescript
const WORKSPACE_CONFIGS: WorkspaceConfig[] = [
  // ... existing workspaces ...
  {
    name: 'Custom Workspace',
    slug: 'custom-workspace',
    description: 'Your custom workspace description',
    type: 'automation',  // or 'data', 'integration', etc.
    features: ['feature1', 'feature2', 'feature3'],
    defaultTools: ['tool1', 'tool2', 'tool3']
  }
];
```

### Changing Workspace Definitions

To update existing workspace definitions:

1. Edit the configuration in `workspace-initialization.ts`
2. Delete existing workspaces:
   ```sql
   DELETE FROM workspaces WHERE slug = 'workspace-slug';
   ```
3. Re-run initialization:
   ```bash
   node dist/scripts/initialize-workspaces.js
   ```

### Adding Custom Workspace Types

Current types: `automation`, `data`, `integration`, `monitoring`, `development`

To add a new type:

1. Add to TypeScript interface:
   ```typescript
   type: 'automation' | 'data' | 'integration' | 'monitoring' | 'development' | 'custom'
   ```

2. Update database schema if needed:
   ```sql
   ALTER TABLE workspaces 
   ALTER COLUMN type TYPE VARCHAR(50);
   ```

## Performance Considerations

### Initialization Time
- **Cold start**: ~2-3 seconds for 20 workspaces
- **Warm start**: <1 second (workspaces already exist)
- **Network latency**: Depends on database location

### Database Impact
- **Queries per workspace**: 2 (existence check + insert)
- **Total queries**: ~40 for full initialization
- **Transaction overhead**: Minimal (no explicit transactions)
- **Index usage**: Optimized with unique slug index

### Optimization Tips
1. Run initialization during off-peak hours
2. Use connection pooling (already implemented)
3. Consider batch inserts for very large workspace counts
4. Monitor database CPU during initialization

## Production Checklist

Before deploying:

- [ ] Database migration applied (workspaces table exists)
- [ ] Database connection configured in .env
- [ ] Database user has CREATE TABLE permission
- [ ] Workspace definitions reviewed and customized
- [ ] Initialization tested in staging environment
- [ ] Monitoring alerts configured for initialization failures
- [ ] Backup strategy includes workspaces table
- [ ] Documentation updated with custom workspaces

## Future Enhancements

### Planned Features
- [ ] Workspace templates import/export
- [ ] Workspace activation/deactivation
- [ ] Workspace usage analytics
- [ ] Custom workspace properties
- [ ] Workspace cloning
- [ ] Workspace permissions
- [ ] Workspace quotas
- [ ] Workspace archiving

### API Endpoints (Future)
- `GET /api/workspaces` - List all workspaces
- `POST /api/workspaces` - Create custom workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/activate` - Activate workspace
- `POST /api/workspaces/:id/deactivate` - Deactivate workspace

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-07  
**Maintainer:** Enterprise Development Team
