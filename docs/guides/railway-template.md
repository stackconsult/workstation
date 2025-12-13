# stackBrowserAgent Railway Deployment Guide

This guide walks you through deploying the Workstation Browser Agent with JWT authentication on Railway.

## Features

- 🔐 JWT Authentication with automatic secret generation
- 🚀 Express API Server
- 📝 TypeScript
- 🐳 Docker Ready
- 🔄 Auto-restart on failure
- 🌐 Chrome Extension integration

## Environment Variables

Railway automatically generates a secure `JWT_SECRET` for you using the `generator: "secret"` configuration in `railway.json`.

### Required Variables (Auto-configured)

- `JWT_SECRET`: Railway generates this automatically (64-character cryptographically secure secret)
- `PORT`: Railway sets this automatically

### Optional Variables

Configure these in your Railway project dashboard if needed:

- `JWT_EXPIRATION`: Token expiration time (default: "24h")
  - Examples: "1h", "7d", "30d"
- `NODE_ENV`: Set to "production" for production deployments
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
  - Example: `https://yourdomain.com,https://app.yourdomain.com`

### JWT_SECRET Requirements

The server validates JWT_SECRET on startup with the following requirements:

✅ **Accepted:**
- Minimum 32 characters (256-bit security)
- Railway auto-generated secrets (64+ characters)
- Cryptographically random strings generated with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

❌ **Rejected:**
- Known weak secrets: "changeme", "secret", "password", "test", etc.
- Default example values from `.env.example`
- Secrets shorter than 32 characters

### Generating Your Own JWT_SECRET (Optional)

If you want to manually set `JWT_SECRET` instead of using Railway's auto-generator:

```bash
# Generate a 64-character secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and set it as the `JWT_SECRET` environment variable in your Railway project dashboard.

## Deployment Steps

### Option 1: Deploy from Railway Template (Recommended)

1. Click the "Deploy on Railway" button in the main README
2. Railway will automatically:
   - Create a new project
   - Generate a secure `JWT_SECRET`
   - Build and deploy the application
   - Assign a public URL (e.g., `https://your-app.railway.app`)
3. Wait for the deployment to complete (~2-3 minutes)
4. Your backend is now live!

### Option 2: Deploy from GitHub Repository

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select the `creditXcredit/workstation` repository
4. Railway will automatically detect the configuration from `railway.json`
5. Environment variables will be auto-configured
6. Wait for deployment to complete

### Option 3: Railway CLI Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Post-Deployment Setup

### 1. Verify Deployment

Visit your Railway deployment URL (e.g., `https://your-app.railway.app`):

```bash
# Health check
curl https://your-app.railway.app/health

# Expected response:
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Get Demo Token

```bash
# Get a demo JWT token for testing
curl https://your-app.railway.app/auth/demo-token

# Expected response:
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 3. Configure Chrome Extension

To connect the Chrome extension to your deployed backend:

1. Open the Chrome extension popup
2. Click on the "Settings" tab
3. Update "Backend URL" to your Railway URL (e.g., `https://your-app.railway.app`)
4. Click "Save Settings"
5. The extension will automatically reconnect

### 4. Test Protected Endpoints

```bash
# Get your token first
TOKEN=$(curl -s https://your-app.railway.app/auth/demo-token | jq -r .token)

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" https://your-app.railway.app/api/protected

# Expected response:
{"message":"Access granted","user":{"userId":"demo-user","email":"demo@example.com"}}
```

## Quick Start After Deployment

1. **Get a JWT Token:**
   ```bash
   curl https://your-app.railway.app/auth/demo-token
   ```

2. **Use the token in Authorization header:**
   ```
   Authorization: Bearer <token>
   ```

3. **Access protected routes:**
   - `GET /api/protected` - Test protected endpoint
   - `GET /api/agent/status` - Agent status
   - `GET /api/agents` - List all agents
   - `POST /api/agents/tasks` - Create agent task

## API Endpoints

- `GET /health` - Health check
- `GET /auth/demo-token` - Get demo JWT token
- `POST /auth/token` - Generate custom token
- `GET /api/protected` - Protected route (requires JWT)
- `GET /api/agent/status` - Agent status (requires JWT)

## Documentation

See the main README.md for full documentation.
