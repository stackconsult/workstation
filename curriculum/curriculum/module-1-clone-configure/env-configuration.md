# Environment Configuration - Module 1

## Overview

Complete reference for all environment variables used in the Workstation browser-agent system.

## Core Configuration

### JWT_SECRET (REQUIRED)

**Description:** Secret key for signing JWT tokens

**Format:** String (64+ characters recommended)

**Generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Security:**
- ⚠️ **NEVER** commit to version control
- ⚠️ **NEVER** use default value `changeme` in production
- ✅ Generate unique secret per environment
- ✅ Rotate quarterly for security

**Example:**
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### JWT_EXPIRATION

**Description:** Token lifetime before requiring refresh

**Format:** Time string (e.g., "24h", "7d", "30m")

**Default:** `24h`

**Common Values:**
- Development: `24h` or `7d`
- Production: `1h` to `24h`
- High security: `15m` with refresh token

**Example:**
```bash
JWT_EXPIRATION=24h
```

### PORT

**Description:** HTTP server port

**Format:** Integer (1024-65535)

**Default:** `3000`

**Considerations:**
- Use 3000 for local development
- Use 80/443 for production (with reverse proxy)
- Ensure port is not in use

**Example:**
```bash
PORT=3000
```

### NODE_ENV

**Description:** Application environment mode

**Values:** `development | production | test`

**Default:** `development`

**Effects:**
- Development: Verbose logging, hot reload, source maps
- Production: Minified code, error reporting, caching
- Test: Mock data, isolated database, fast execution

**Example:**
```bash
NODE_ENV=production
```

## Database Configuration

### DATABASE_URL (Optional)

**Description:** PostgreSQL connection string

**Format:** `postgresql://user:password@host:port/database`

**Default:** Uses SQLite if not set

**Production Example:**
```bash
DATABASE_URL=postgresql://workstation:secure_password@localhost:5432/workstation_prod
```

**Railway/Heroku:**
```bash
# Automatically set by platform
DATABASE_URL=$DATABASE_URL
```

### DATABASE_SSL

**Description:** Enable SSL for database connections

**Values:** `true | false`

**Default:** `false`

**Production:**
```bash
DATABASE_SSL=true
```

## Security Configuration

### RATE_LIMIT_MAX

**Description:** Maximum requests per window

**Format:** Integer

**Default:** `100`

**Recommendations:**
- Development: `1000` (permissive)
- Production: `100` (balanced)
- High traffic: `500` with CDN
- API-only: `50` (restrictive)

**Example:**
```bash
RATE_LIMIT_MAX=100
```

### RATE_LIMIT_WINDOW_MS

**Description:** Time window for rate limiting (milliseconds)

**Format:** Integer

**Default:** `900000` (15 minutes)

**Example:**
```bash
RATE_LIMIT_WINDOW_MS=900000
```

### CORS_ORIGIN

**Description:** Allowed CORS origins (comma-separated)

**Format:** URL list or `*` for all

**Default:** `*` (development only)

**Production Example:**
```bash
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

## Browser Automation

### BROWSER_HEADLESS

**Description:** Run browsers in headless mode

**Values:** `true | false`

**Default:** `true`

**Use Cases:**
- Production/CI: `true` (no display required)
- Debugging: `false` (see browser UI)

**Example:**
```bash
BROWSER_HEADLESS=true
```

### BROWSER_TIMEOUT

**Description:** Default timeout for browser operations (ms)

**Format:** Integer

**Default:** `30000` (30 seconds)

**Example:**
```bash
BROWSER_TIMEOUT=30000
```

## Integration Configuration

### SLACK_WEBHOOK_URL (Optional)

**Description:** Slack webhook for notifications

**Format:** URL

**Setup:**
1. Go to Slack App settings
2. Enable Incoming Webhooks
3. Create webhook for channel
4. Copy URL

**Example:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### GITHUB_TOKEN (Optional)

**Description:** GitHub Personal Access Token for MCP containers

**Format:** Token string (starts with `ghp_`)

**Scopes Required:**
- `repo` - Full repository access
- `read:org` - Read organization data
- `workflow` - Update GitHub Actions workflows

**Example:**
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Logging Configuration

### LOG_LEVEL

**Description:** Minimum log level to output

**Values:** `debug | info | warn | error`

**Default:** `info`

**Recommendations:**
- Development: `debug`
- Staging: `info`
- Production: `warn`

**Example:**
```bash
LOG_LEVEL=info
```

### LOG_FILE

**Description:** Path to log file

**Format:** File path

**Default:** `logs/app.log`

**Example:**
```bash
LOG_FILE=/var/log/workstation/app.log
```

## Environment-Specific Examples

### Development (.env.development)

```bash
# Core
JWT_SECRET=dev-secret-DO-NOT-USE-IN-PROD
JWT_EXPIRATION=7d
PORT=3000
NODE_ENV=development

# Database
# Uses SQLite by default

# Security (permissive for dev)
RATE_LIMIT_MAX=1000
CORS_ORIGIN=*

# Browser
BROWSER_HEADLESS=false
BROWSER_TIMEOUT=60000

# Logging
LOG_LEVEL=debug
```

### Production (.env.production)

```bash
# Core (MUST be set securely)
JWT_SECRET=${SECURE_JWT_SECRET}
JWT_EXPIRATION=1h
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=true

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
CORS_ORIGIN=https://app.example.com

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/workstation/app.log

# Integrations
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
```

### Testing (.env.test)

```bash
# Core
JWT_SECRET=test-secret-insecure
JWT_EXPIRATION=1h
PORT=3001
NODE_ENV=test

# Database (in-memory)
DATABASE_URL=:memory:

# Security (permissive for tests)
RATE_LIMIT_MAX=10000

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=5000

# Logging
LOG_LEVEL=error
```

## Railway Deployment

Railway automatically injects some environment variables:

```bash
# Automatically set by Railway
PORT=${PORT}                    # Assigned by platform
DATABASE_URL=${DATABASE_URL}    # If PostgreSQL addon enabled
RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT}

# You must set manually
JWT_SECRET=${JWT_SECRET}
```

## Docker Configuration

When using Docker, pass environment variables:

```bash
docker run \
  -e JWT_SECRET=${JWT_SECRET} \
  -e NODE_ENV=production \
  -e DATABASE_URL=${DATABASE_URL} \
  -p 3000:3000 \
  workstation:latest
```

Or use `.env` file:

```bash
docker run --env-file .env.production -p 3000:3000 workstation:latest
```

## Security Best Practices

### Secrets Management

1. **Never commit secrets to Git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use secret management service**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Railway/Heroku config vars

3. **Rotate secrets regularly**
   - JWT_SECRET: Quarterly
   - Database passwords: Monthly
   - API keys: As needed

### Environment Separation

```
Development → Staging → Production
     ↓            ↓          ↓
  dev.env    staging.env  prod.env
```

Never share secrets between environments.

## Validation Script

Verify configuration before starting:

```bash
#!/bin/bash
# validate-env.sh

required_vars=("JWT_SECRET" "NODE_ENV" "PORT")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done

if [ "$JWT_SECRET" = "changeme" ]; then
  echo "ERROR: JWT_SECRET must be changed from default"
  exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "WARNING: JWT_SECRET should be at least 32 characters"
fi

echo "✅ Environment configuration validated"
```

## Next Steps

✅ Environment variables configured

→ Proceed to [validation-checklist.md](./validation-checklist.md) to verify your setup
