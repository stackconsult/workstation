# Workstation Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start backend
npm start

# Deploy Chrome extension
./scripts/deploy-chrome-extension.sh

# Deploy Workflow builder
./scripts/deploy-workflow-builder.sh

# Deploy both (one-click)
./scripts/deploy-all.sh
```

## 🌐 URLs

- Backend Health: http://localhost:3000/health
- Workflow Builder: http://localhost:3000/workflow-builder.html
- Dashboard: http://localhost:3000/dashboard.html
- API Docs: http://localhost:3000/api-docs

## 🔑 Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key-here

# Optional
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## 📦 Chrome Extension Paths

- Source: `chrome-extension/`
- Build: `build/chrome-extension/`
- Package: `public/downloads/workstation-chrome-extension-v*.zip`

## 🎨 Workflow Builder Paths

- Source: `public/workflow-builder.html`
- Build: `build/workflow-builder/`
- Package: `public/downloads/workstation-workflow-builder-v*.zip`

## 🔧 Common Tasks

### Load Chrome Extension
1. chrome://extensions/
2. Enable Developer mode
3. Load unpacked: `build/chrome-extension/`

### Test Workflow Builder
1. Open: http://localhost:3000/workflow-builder.html
2. Add nodes: Start → Navigate → End
3. Configure and Execute

### Check Backend Status
```bash
curl http://localhost:3000/health
```

### Get JWT Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}'
```

## 📊 API Endpoints

- POST /api/auth/login - Get JWT token
- GET /api/v2/workflows - List workflows
- POST /api/v2/workflows - Create workflow
- POST /api/v2/workflows/:id/execute - Execute workflow
- GET /api/v2/executions/:id/status - Get execution status
- GET /api/v2/templates - List templates

## 🐛 Debug Mode

```bash
# Enable debug logs
export LOG_LEVEL=debug
npm start

# Check logs
tail -f logs/app.log
```
