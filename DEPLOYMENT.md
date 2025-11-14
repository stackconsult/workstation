# Deployment Guide

## Docker Deployment

### Local Development with Docker Compose

1. **Create `.env` file**:
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Check health**:
```bash
curl http://localhost:8000/health
```

4. **View logs**:
```bash
docker-compose logs -f backend
```

5. **Stop services**:
```bash
docker-compose down
```

### Production Deployment

#### Option 1: Railway (One-Click Deploy)

Deploy instantly with Railway template:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3fjp1R?referralCode=yft2bJ&utm_medium=integration&utm_source=template&utm_campaign=generic)

This will automatically:
- Provision PostgreSQL database
- Deploy FastAPI backend
- Configure environment variables
- Enable SSL/TLS
- Provide deployment URL

**Alternative - Railway CLI:**

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and init:
```bash
railway login
railway init
```

3. Add environment variables in Railway dashboard

4. Deploy:
```bash
cd backend
railway up
```

5. Get URL:
```bash
railway domain
```

#### Option 2: Docker on VPS

1. Build and push image:
```bash
cd backend
docker build -t your-registry/stackbrowseragent:latest .
docker push your-registry/stackbrowseragent:latest
```

2. On VPS, create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  backend:
    image: your-registry/stackbrowseragent:latest
    restart: always
    environment:
      - DATABASE_URL=your-db-url
      # Add other env vars
    ports:
      - "8000:8000"
```

3. Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Chrome Extension Deployment

### Load Unpacked (Development)

1. Build extension:
```bash
npm run build
```

2. Open Chrome: `chrome://extensions`

3. Enable "Developer mode"

4. Click "Load unpacked"

5. Select `dist/` folder

### Chrome Web Store (Production)

1. Create developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

2. Build extension:
```bash
npm run build
```

3. Create ZIP:
```bash
cd dist
zip -r ../stackbrowseragent.zip *
```

4. Upload ZIP to Chrome Web Store

5. Fill in listing details and submit for review

## Environment Variables

### Backend Required Variables:
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-...
```

### Backend Optional Variables:
```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
GROQ_API_KEY=gsk_...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=stackbrowseragent
DEBUG=false
LOG_LEVEL=INFO
```

## Health Monitoring

### Endpoints
- Health: `GET /health`
- Status: `GET /api/status`
- Docs: `GET /docs`

### Docker Health Checks
```bash
docker inspect stackbrowseragent-backend | grep -A 10 Health
```

## Backup & Recovery

### Database Backup
```bash
docker exec stackbrowseragent-db pg_dump -U postgres stackbrowseragent > backup.sql
```

### Database Restore
```bash
docker exec -i stackbrowseragent-db psql -U postgres stackbrowseragent < backup.sql
```

## Troubleshooting

### Backend won't start
1. Check logs: `docker-compose logs backend`
2. Verify DATABASE_URL is correct
3. Ensure ports are not in use

### Extension can't connect to backend
1. Check backend URL in extension settings
2. Verify CORS is enabled
3. Check backend is running: `curl http://localhost:8000/health`

### Database connection issues
1. Check postgres is running: `docker-compose ps`
2. Verify credentials in .env
3. Check postgres logs: `docker-compose logs postgres`
