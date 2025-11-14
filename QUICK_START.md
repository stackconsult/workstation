# Quick Start Guide - 5 Minute Deployment

Get stackBrowserAgent running in production in 5 minutes with one click.

## Option 1: One-Click Deploy (Fastest - 2 minutes)

### Deploy Backend with Railway Template

Click this button to deploy instantly:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3fjp1R?referralCode=yft2bJ&utm_medium=integration&utm_source=template&utm_campaign=generic)

What happens:
1. ✅ Railway provisions PostgreSQL automatically
2. ✅ Backend deploys with all dependencies
3. ✅ Environment variables configured
4. ✅ SSL/TLS enabled automatically
5. ✅ Get your deployment URL immediately

**Time**: ~2 minutes

Then continue to [Step 2: Setup Extension](#step-2-setup-extension-2-minutes)

---

## Option 2: Automated Script Deployment

### One-Command Deployment

```bash
# Clone repository
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent

# Run automated deployment
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

The script will:
1. ✅ Install Railway CLI (if needed)
2. ✅ Login to Railway
3. ✅ Create project
4. ✅ Add PostgreSQL database
5. ✅ Configure environment variables
6. ✅ Deploy backend
7. ✅ Test deployment
8. ✅ Show your deployment URL

**Time**: ~5 minutes

---

## Option 3: Manual Deployment

### Step 1: Deploy Backend (3 minutes)

1. **Go to Railway**
   - Visit https://railway.app
   - Click "Start a New Project"
   - Login with GitHub

2. **Deploy**
   - Select "Deploy from GitHub repo"
   - Choose `stackconsult/stackBrowserAgent`
   - Click "Add PostgreSQL" from the dashboard

3. **Configure**
   - Go to Variables tab
   - Add: `JWT_SECRET_KEY` = `[openssl rand -hex 32]`
   - Add: `ENVIRONMENT` = `production`

4. **Wait for Build**
   - Takes ~2 minutes
   - Get your URL from the dashboard

### Step 2: Setup Extension (2 minutes)

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dist/ folder
```

### Step 3: Configure Backend URL (1 minute)

Edit `src/config/backend.ts`:
```typescript
export const BACKEND_URL = 'https://your-app.railway.app';
```

Rebuild:
```bash
npm run build
```

### Step 4: Test (1 minute)

```bash
# Test backend
curl https://your-app.railway.app/health

# Register user
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"test"}'
```

**Time**: ~7 minutes

---

## Option 3: Local Development

### Quick Local Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload

# Extension (in new terminal)
npm install
npm run dev
```

Load extension from `dist/` folder in Chrome.

**Time**: ~3 minutes

---

## Verification Checklist

- [ ] Backend health check passes: `curl [URL]/health`
- [ ] Database connected (in health check response)
- [ ] Extension loaded in Chrome
- [ ] Extension shows "Backend Connected" status
- [ ] User registration works
- [ ] Login works
- [ ] Task creation works

---

## What You Get

### Backend (Running on Railway)
- ✅ FastAPI server with 20 concurrent workers
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ RAG with vector database
- ✅ Workflow engine
- ✅ Auto-deploy on git push

### Chrome Extension
- ✅ 6 specialized AI agents
- ✅ Browser automation
- ✅ Workflow execution
- ✅ Multi-LLM support
- ✅ Backend integration

### Infrastructure
- ✅ Docker containerization
- ✅ CI/CD with GitHub Actions
- ✅ Automated testing
- ✅ Health monitoring
- ✅ Production-ready

---

## Costs

**Free Tier** (Sufficient for beta):
- Railway: $5/month credits (free)
- Extension: Free to use
- **Total**: $0/month for small usage

**Paid** (For production):
- Railway Hobby: $5/month + usage (~$10-20/month for 100-500 users)
- **Total**: ~$10-20/month

---

## Troubleshooting

### Backend won't start
```bash
railway logs  # Check error logs
railway restart  # Restart service
```

### Extension can't connect
1. Check backend URL is correct
2. Verify backend is running: `curl [URL]/health`
3. Check browser console for errors

### Database issues
```bash
railway variables  # Verify DATABASE_URL exists
railway restart  # Restart to reconnect
```

---

## Next Steps

After successful deployment:

1. **Invite Beta Users**
   - Share extension package
   - Provide backend URL
   - Collect feedback

2. **Monitor Usage**
   - Check Railway dashboard
   - View logs: `railway logs`
   - Set up alerts

3. **Iterate**
   - Fix reported issues
   - Add requested features
   - Auto-deploys on git push

---

## Support

- **Deployment Issues**: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- **Extension Issues**: See [INSTALLATION.md](INSTALLATION.md)
- **API Documentation**: Visit `https://your-app.railway.app/docs`
- **GitHub Issues**: https://github.com/stackconsult/stackBrowserAgent/issues

---

**Status**: ✅ Production-Ready
**Deployment Time**: 10 minutes
**Cost**: Free tier available
**Support**: Comprehensive documentation included
