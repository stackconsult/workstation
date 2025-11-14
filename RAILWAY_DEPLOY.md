# Railway Deployment Guide

Complete guide to deploy stackBrowserAgent backend to Railway with automatic PostgreSQL provisioning and GitHub integration.

## Prerequisites

- GitHub account (this repository)
- Railway account (free tier: $5/month credit)
- Railway CLI installed (optional, for local deployment)

## Option 1: One-Click Deploy (Recommended)

### Step 1: Click Deploy Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

Or manually:

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize GitHub and select `stackconsult/stackBrowserAgent`
5. Railway will automatically detect `railway.toml` and configure everything

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically:
   - Provision a PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Connect it to your backend service

### Step 3: Configure Environment Variables

In Railway dashboard → Your Service → Variables, add:

```bash
# Required
JWT_SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32

# Optional (for LLM features)
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=your-pinecone-key

# Optional (for production)
ENVIRONMENT=production
LOG_LEVEL=info
```

### Step 4: Deploy

1. Click "Deploy" in Railway dashboard
2. Railway will:
   - Build Docker image from `backend/Dockerfile`
   - Run database migrations
   - Start FastAPI server
   - Provide public URL (e.g., `https://your-app.up.railway.app`)

### Step 5: Verify Deployment

```bash
# Check health
curl https://your-app.up.railway.app/health

# Expected response:
# {"status": "healthy", "version": "1.0.0", "timestamp": "..."}

# Check API docs
# Open: https://your-app.up.railway.app/docs
```

---

## Option 2: Railway CLI Deployment

### Step 1: Install Railway CLI

```bash
# macOS
brew install railway

# npm
npm install -g @railway/cli

# Windows (Scoop)
scoop install railway
```

### Step 2: Login and Initialize

```bash
# Login to Railway
railway login

# Navigate to project root
cd /path/to/stackBrowserAgent

# Initialize Railway project
railway init
```

### Step 3: Link to GitHub Repository

```bash
# Link to existing GitHub repo
railway link

# Or create new project
railway init --name stackbrowser-agent
```

### Step 4: Add PostgreSQL

```bash
# Add PostgreSQL plugin
railway add postgresql

# Verify DATABASE_URL is set
railway variables
```

### Step 5: Set Environment Variables

```bash
# Set required variables
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)

# Optional: Set OpenAI key
railway variables set OPENAI_API_KEY=sk-...

# Optional: Set Pinecone key
railway variables set PINECONE_API_KEY=your-key
```

### Step 6: Deploy

```bash
# Deploy from current directory
railway up

# Or deploy specific branch
railway up --branch main

# Monitor logs
railway logs
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `JWT_SECRET_KEY` | JWT signing key | Generate with `openssl rand -hex 32` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | None |
| `PINECONE_API_KEY` | Pinecone vector DB key | None |
| `PINECONE_ENVIRONMENT` | Pinecone environment | `us-east-1-aws` |
| `ENVIRONMENT` | Environment (dev/production) | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGINS` | Allowed CORS origins | `["*"]` |

---

## Post-Deployment Configuration

### 1. Update Extension Backend URL

In Chrome extension, configure backend URL:

```typescript
// src/config/backend.ts
export const BACKEND_URL = 'https://your-app.up.railway.app';
```

Or in extension popup settings:
1. Open extension popup
2. Go to Settings
3. Set Backend URL: `https://your-app.up.railway.app`

### 2. Test Integration

```bash
# Register a user
curl -X POST https://your-app.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "username": "testuser"
  }'

# Login
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Test health
curl https://your-app.up.railway.app/health
```

### 3. Configure Custom Domain (Optional)

1. In Railway dashboard → Settings → Domains
2. Add custom domain
3. Configure DNS records:
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```
4. SSL is automatically provisioned

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
railway logs

# Last 100 lines
railway logs --tail 100

# Follow logs
railway logs --follow
```

### Monitor Metrics

In Railway dashboard:
- **CPU Usage**: Monitor under Metrics tab
- **Memory Usage**: Check resource consumption
- **Request Count**: View in Observability
- **Response Times**: Available in metrics

### Health Checks

Railway automatically monitors `/health` endpoint:
- Interval: 60 seconds
- Timeout: 30 seconds
- Unhealthy threshold: 3 failures

### Prometheus Metrics

Access metrics at:
```
https://your-app.up.railway.app/metrics
```

---

## Automatic Deployments

### GitHub Integration

Railway automatically deploys on:
- Push to `main` branch
- Merge to `main` via PR
- Manual deploy from dashboard

### Deploy Previews

For each PR, Railway creates a preview deployment:
1. Temporary URL for testing
2. Separate database instance
3. Auto-deleted when PR closes

### Rollback

```bash
# List deployments
railway deployments

# Rollback to specific deployment
railway rollback <deployment-id>
```

Or in Railway dashboard:
1. Deployments tab
2. Select previous deployment
3. Click "Redeploy"

---

## Scaling

### Vertical Scaling (Upgrade Resources)

In Railway dashboard → Settings → Resources:
- **Memory**: 512MB (free) → 8GB (paid)
- **CPU**: 1 vCPU (free) → 32 vCPU (paid)

### Horizontal Scaling (Multiple Instances)

Railway Pro plan allows multiple instances:
1. Settings → Instances
2. Set instance count (2-10+)
3. Load balancing automatic

### Database Scaling

PostgreSQL automatically scales with:
- Connection pooling (20 connections free tier)
- Storage: 1GB (free) → unlimited (paid)

---

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
railway logs --deployment <deployment-id>

# Verify Dockerfile
docker build -t test backend/

# Check environment variables
railway variables
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test connection
railway run python backend/src/database/connection.py
```

### High Memory Usage

1. Check logs for memory leaks
2. Reduce worker count in settings
3. Enable connection pooling

### Slow Response Times

1. Check Prometheus metrics: `/metrics`
2. Monitor database query performance
3. Enable Redis caching (add Redis service)

---

## Cost Estimation

### Free Tier
- **Included**: $5/month credit
- **Backend**: ~$2/month (512MB RAM, 1 vCPU)
- **PostgreSQL**: ~$2/month (1GB storage)
- **Total**: ~$4/month (within free tier)

### Scaling Costs
- **1GB RAM**: $10/month
- **2GB RAM**: $20/month
- **PostgreSQL 10GB**: $10/month

---

## Security

### Best Practices

1. **Rotate JWT_SECRET_KEY** regularly:
   ```bash
   railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
   railway up  # Redeploy
   ```

2. **Enable IP Allowlist** (Pro plan):
   - Settings → Networking → IP Allowlist
   - Add your IP ranges

3. **Audit Logs**:
   - Monitor access logs in Railway dashboard
   - Check `/api/monitoring/stats` for anomalies

4. **Database Backups**:
   - Railway automatically backs up PostgreSQL daily
   - Download backups: Settings → PostgreSQL → Backups

---

## Next Steps

After deployment:

1. ✅ **Test API endpoints** - Verify all routes work
2. ✅ **Configure extension** - Update backend URL
3. ✅ **Register test users** - Create test accounts
4. ✅ **Monitor performance** - Check logs and metrics
5. ✅ **Set up alerts** - Configure Railway notifications

### Production Checklist

- [ ] JWT_SECRET_KEY is strong (32+ characters)
- [ ] OPENAI_API_KEY configured (if using LLM features)
- [ ] CORS_ORIGINS restricted to extension domain
- [ ] Database backups enabled
- [ ] Monitoring and alerts configured
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS verified
- [ ] Load testing completed

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: https://github.com/stackconsult/stackBrowserAgent/issues

---

## Quick Reference

```bash
# Deploy
railway up

# View logs
railway logs --follow

# Set variable
railway variables set KEY=value

# Rollback
railway rollback <deployment-id>

# Add PostgreSQL
railway add postgresql

# Link to GitHub
railway link

# Open dashboard
railway open
```

---

**Status**: ✅ Ready for deployment
**Time to deploy**: ~5 minutes
**Cost**: Free tier ($5/month credit included)
