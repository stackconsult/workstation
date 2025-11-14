# Railway Deployment Guide

Complete guide for deploying stackBrowserAgent backend to Railway with one-click setup.

---

## Prerequisites

1. **GitHub Account** (you already have this repo)
2. **Railway Account** (free tier sufficient)
   - Sign up at https://railway.app
   - Connect your GitHub account

---

## Quick Deploy (5 Minutes)

### Method 1: One-Click Deploy Button

Click the button below to deploy instantly:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3fjp1R?referralCode=yft2bJ&utm_medium=integration&utm_source=template&utm_campaign=generic)

This will:
- ✅ Automatically provision PostgreSQL database
- ✅ Set up the FastAPI backend with all dependencies
- ✅ Configure environment variables (you'll set JWT secret and optional API keys)
- ✅ Deploy to Railway's infrastructure with SSL/TLS
- ✅ Provide your deployment URL immediately

### Method 2: Manual Deploy via Railway Dashboard

1. **Login to Railway**
   ```
   Go to: https://railway.app
   Click "Login with GitHub"
   ```

2. **Create New Project**
   ```
   Click "New Project"
   Select "Deploy from GitHub repo"
   Choose: stackconsult/stackBrowserAgent
   Select branch: copilot/build-complete-browser-extension
   ```

3. **Add PostgreSQL Database**
   ```
   In your project, click "New"
   Select "Database" → "PostgreSQL"
   Railway automatically provisions and connects it
   ```

4. **Configure Environment Variables**
   
   Railway will prompt you to add variables. Click "Variables" and add:
   
   ```env
   # Required
   DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-filled by Railway
   JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
   
   # Optional LLM Keys (add if using RAG features)
   OPENAI_API_KEY=your_openai_key_here
   PINECONE_API_KEY=your_pinecone_key_here
   PINECONE_ENVIRONMENT=your_pinecone_env_here
   
   # Application Settings
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   CORS_ORIGINS=*
   
   # Monitoring
   PROMETHEUS_ENABLED=true
   
   # Browser Automation
   PLAYWRIGHT_HEADLESS=true
   ```

5. **Deploy**
   ```
   Click "Deploy"
   Railway builds and deploys automatically
   Wait 2-3 minutes for build to complete
   ```

6. **Get Your URL**
   ```
   Once deployed, Railway shows your URL:
   https://your-app-name.up.railway.app
   
   Copy this URL - you'll use it in the Chrome extension
   ```

---

## Method 3: Deploy via Railway CLI

### Install Railway CLI

```bash
# macOS
brew install railway

# Linux/WSL
curl -fsSL https://railway.app/install.sh | sh

# Windows
iwr https://railway.app/install.ps1 | iex
```

### Deploy Steps

```bash
# 1. Login to Railway
railway login

# 2. Initialize project (in repo root)
cd /path/to/stackBrowserAgent
railway init

# 3. Link to PostgreSQL
railway add postgresql

# 4. Set environment variables
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO

# Optional: Add LLM keys
railway variables set OPENAI_API_KEY=your_key_here
railway variables set PINECONE_API_KEY=your_key_here

# 5. Deploy
railway up

# 6. Get deployment URL
railway open
```

---

## Verify Deployment

### 1. Health Check

```bash
# Replace with your Railway URL
curl https://your-app-name.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-09T..."
}
```

### 2. API Documentation

Visit: `https://your-app-name.up.railway.app/docs`

You should see the interactive Swagger UI with all API endpoints.

### 3. Register Test User

```bash
# Register
curl -X POST https://your-app-name.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure_password_123",
    "username": "testuser"
  }'

# Login
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure_password_123"
  }'
```

---

## Connect Chrome Extension

### 1. Update Extension Configuration

In your Chrome extension, update the backend URL:

```typescript
// src/config/backend.ts
export const BACKEND_CONFIG = {
  baseUrl: 'https://your-app-name.up.railway.app',
  timeout: 30000,
  retryAttempts: 3
};
```

Or use the settings UI:
1. Click extension icon
2. Go to Settings
3. Enter Backend URL: `https://your-app-name.up.railway.app`
4. Click "Save"

### 2. Test Integration

```typescript
// In extension console
import { getAPIClient } from './services/api';

const client = getAPIClient();
const health = await client.healthCheck();
console.log(health); // Should show "healthy"
```

---

## Automatic Deployments

Railway automatically deploys on every push to your GitHub branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin copilot/build-complete-browser-extension

# Railway detects push and redeploys automatically
# Check deployment status: railway status
```

---

## Monitoring

### Railway Dashboard

1. **Logs**: View real-time logs in Railway dashboard
   ```
   railway logs
   ```

2. **Metrics**: Railway shows:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

3. **Prometheus Metrics**: Access at:
   ```
   https://your-app-name.up.railway.app/metrics
   ```

### Custom Domain (Optional)

1. Go to Railway project settings
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your custom domain (e.g., api.yourdomain.com)
5. Add CNAME record in your DNS:
   ```
   CNAME api -> your-app-name.up.railway.app
   ```

---

## Scaling

### Vertical Scaling (More Resources)

Railway automatically scales within your plan:
- Free tier: 512MB RAM, shared CPU
- Hobby: $5/month, 8GB RAM, 8 vCPUs
- Pro: Custom resources

### Horizontal Scaling (Multiple Instances)

Edit `railway.toml`:
```toml
[deploy]
numReplicas = 2  # Run 2 instances
```

Railway handles load balancing automatically.

---

## Database Backups

### Automatic Backups

Railway PostgreSQL includes automatic daily backups (retained 7 days).

### Manual Backup

```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Build Fails

**Error**: "Dockerfile not found"
**Solution**: Ensure `railway.toml` points to correct path:
```toml
[build]
dockerfilePath = "backend/Dockerfile"
```

**Error**: "Port binding failed"
**Solution**: Ensure your app uses Railway's PORT variable:
```python
port = int(os.getenv("PORT", 8000))
uvicorn.run(app, host="0.0.0.0", port=port)
```

### Database Connection Issues

**Error**: "Could not connect to database"
**Solution**: 
1. Check `DATABASE_URL` is set: `railway variables`
2. Restart service: `railway restart`
3. Check logs: `railway logs`

### Extension Can't Connect

**Error**: CORS errors in browser console
**Solution**: Add extension origin to CORS_ORIGINS:
```bash
railway variables set CORS_ORIGINS="chrome-extension://your-extension-id,*"
```

---

## Cost Optimization

### Free Tier Limits

Railway free tier includes:
- $5 credit/month
- Unlimited bandwidth
- Up to 500 hours/month

**Typical Usage**:
- Backend API: ~$3/month (512MB RAM, low traffic)
- PostgreSQL: ~$2/month (256MB storage)
- **Total**: ~$5/month (fits free tier)

### Tips to Stay in Free Tier

1. **Enable sleep mode** for development:
   ```toml
   [deploy]
   sleepApplication = true  # Sleep after 10min inactivity
   ```

2. **Optimize database queries**: Use indexes
3. **Use caching**: Enable Redis caching (additional $2/month)

---

## Production Checklist

Before going to production:

- [ ] Generate secure JWT secret: `openssl rand -hex 32`
- [ ] Set `ENVIRONMENT=production`
- [ ] Add real LLM API keys (if using RAG features)
- [ ] Configure custom domain
- [ ] Set up monitoring alerts
- [ ] Enable database backups
- [ ] Test all API endpoints
- [ ] Verify extension integration
- [ ] Load test the system
- [ ] Document API keys securely
- [ ] Set up error tracking (Sentry optional)

---

## Support

**Railway Issues**:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

**Application Issues**:
- Check logs: `railway logs`
- View metrics: Railway dashboard
- Restart: `railway restart`
- Rebuild: `railway up --detach`

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Verify API is accessible
3. ✅ Connect Chrome extension
4. ✅ Test full workflow
5. → Gather user feedback
6. → Implement enhancements based on usage

---

## Complete Deployment Summary

```bash
# Quick start commands
railway login                    # Authenticate
railway init                     # Create project
railway add postgresql          # Add database
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway up                      # Deploy
railway open                    # View in browser

# That's it! Backend is now live at:
# https://your-app-name.up.railway.app
```

**Deployment time**: 5 minutes
**Cost**: Free (within $5/month credit)
**Maintenance**: Automatic updates on git push

Your hybrid browser agent is now production-ready! 🚀
