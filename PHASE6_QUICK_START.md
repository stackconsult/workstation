# Phase 6: Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy and edit `.env.example`:
```bash
cp .env.example .env
```

**Minimum Required:**
```env
JWT_SECRET=your-jwt-secret-32-chars-min
SESSION_SECRET=your-session-secret-32-chars-min
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workstation_saas
DB_USER=postgres
DB_PASSWORD=your-password
```

### 3. Database Setup
```bash
# Create database
createdb workstation_saas

# Run migration
psql -U postgres -d workstation_saas -f src/db/migrations/001_add_workspaces.sql
```

### 4. Initialize Workspaces
```bash
npm run build
node dist/scripts/initialize-workspaces.js
```

### 5. Start Server
```bash
npm start
```

## 📱 Test The Features

### Test Workspace Login (Generic Credentials)
```bash
curl -X POST http://localhost:7042/api/workspaces/workspace-alpha/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ws_alpha_user","password":"workspace123"}'
```

### Test Workspace Activation
```bash
curl -X POST http://localhost:7042/api/workspaces/workspace-alpha/activate \
  -H "Content-Type: application/json" \
  -d '{
    "genericUsername":"ws_alpha_user",
    "genericPassword":"workspace123",
    "email":"test@example.com",
    "password":"NewPassword123"
  }'
```

### Test User Registration
```bash
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123",
    "fullName":"Test User"
  }'
```

## 🔧 OAuth Setup (Optional)

### Google OAuth
1. Visit: https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Redirect URI: `http://localhost:7042/api/auth/google/callback`
5. Add to `.env`:
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### GitHub OAuth
1. Visit: https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:7042/api/auth/github/callback`
4. Add to `.env`:
```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Slack App
1. Visit: https://api.slack.com/apps
2. Create app → From scratch
3. Add scopes: `chat:write`, `commands`, `channels:read`, `users:read`
4. Install to workspace
5. Add to `.env`:
```env
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx
```

## 📧 Email Setup (Optional)

### Gmail
1. Enable 2FA on Google account
2. Create app password
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=noreply@yourdomain.com
```

## 🎯 20 Default Workspaces

All workspaces use password: `workspace123`

1. **workspace-alpha** - `ws_alpha_user`
2. **workspace-beta** - `ws_beta_user`
3. **workspace-gamma** - `ws_gamma_user`
4. **workspace-delta** - `ws_delta_user`
5. **workspace-epsilon** - `ws_epsilon_user`
6. **workspace-zeta** - `ws_zeta_user`
7. **workspace-eta** - `ws_eta_user`
8. **workspace-theta** - `ws_theta_user`
9. **workspace-iota** - `ws_iota_user`
10. **workspace-kappa** - `ws_kappa_user`
11. **workspace-lambda** - `ws_lambda_user`
12. **workspace-mu** - `ws_mu_user`
13. **workspace-nu** - `ws_nu_user`
14. **workspace-xi** - `ws_xi_user`
15. **workspace-omicron** - `ws_omicron_user`
16. **workspace-pi** - `ws_pi_user`
17. **workspace-rho** - `ws_rho_user`
18. **workspace-sigma** - `ws_sigma_user`
19. **workspace-tau** - `ws_tau_user`
20. **workspace-upsilon** - `ws_upsilon_user`

## 🔍 Key Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `POST /api/auth/password-reset/request` - Reset password
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces/:slug/login` - Generic login
- `POST /api/workspaces/:slug/activate` - Activate
- `GET /api/workspaces/my/workspaces` - User's workspaces

### Slack
- `GET /api/slack/oauth/authorize?workspace_id=xxx` - Connect Slack
- `GET /api/slack/status/:workspaceId` - Status
- `POST /api/slack/test/:workspaceId` - Test

## 📚 Full Documentation

See `PHASE6_IMPLEMENTATION_GUIDE.md` for complete details.

## 🐛 Common Issues

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env
```

**Port 7042 already in use:**
```bash
# Change port in .env
PORT=8080
```

**Workspaces not created:**
```bash
# Re-run initialization
node dist/scripts/initialize-workspaces.js
```

## ✅ Verification

Check everything works:
```bash
# 1. Health check
curl http://localhost:7042/health

# 2. List workspaces
curl http://localhost:7042/api/workspaces

# 3. Register user
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'
```

## 🎓 Next Steps

1. ✅ Test workspace activation flow
2. ✅ Set up OAuth providers
3. ✅ Configure email service
4. ✅ Connect Slack integration
5. ✅ Review security settings
6. ✅ Deploy to production

---

**Need help?** Check `PHASE6_IMPLEMENTATION_GUIDE.md` for detailed documentation.
