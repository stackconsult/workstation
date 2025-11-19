# Coding Agent Quick Reference

## 🚀 Quick Start

```bash
# Install and build
npm install && npm run build

# Start service
./scripts/start-agent.sh

# Get token
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')
```

## 📡 Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/git/status` | GET | Repository status |
| `/api/v2/git/branches` | GET | List branches |
| `/api/v2/git/commit` | POST | Commit changes |
| `/api/v2/git/push` | POST | Push to remote |
| `/api/v2/git/prs` | GET | List pull requests |
| `/api/v2/git/pr` | POST | Create pull request |
| `/api/v2/git/sync` | POST | Sync repository |

## 🔧 Common Commands

### Check Status
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7042/api/v2/git/status
```

### Commit & Push
```bash
# Commit
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Your commit"}'

# Push
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

### Create PR
```bash
curl -X POST http://localhost:7042/api/v2/git/pr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your PR title",
    "head": "feature-branch",
    "base": "main",
    "body": "PR description"
  }'
```

### Sync Repository
```bash
curl -X POST http://localhost:7042/api/v2/git/sync \
  -H "Authorization: Bearer $TOKEN"
```

## 🔑 Environment Setup

```bash
# .env file
PORT=7042
JWT_SECRET=your-secret-32-chars-minimum
GITHUB_TOKEN=your-github-token
NODE_ENV=development
```

### Generate GitHub Token
1. Visit: https://github.com/settings/tokens
2. Create token with `repo` scope
3. Add to `.env` file

## 🐳 Docker

```bash
# Build
docker build -t workstation-agent .

# Run
docker run -d -p 7042:7042 \
  -e JWT_SECRET=your-secret \
  -e GITHUB_TOKEN=your-token \
  workstation-agent
```

## 🛠️ Management

```bash
# Start
./scripts/start-agent.sh

# Stop
./scripts/stop-agent.sh

# Logs
tail -f /var/log/workstation/workstation-agent.log

# Status
curl http://localhost:7042/health
```

## 🔒 Security

- All endpoints require JWT authentication
- Use strong JWT_SECRET (32+ chars)
- Never commit tokens to code
- Rate limited: 100 req/15min
- Use HTTPS in production

## 📚 Full Documentation

- Complete Guide: `docs/guides/CODING_AGENT.md`
- API Reference: `API.md`
- Main README: `README.md`

## 🆘 Troubleshooting

### Port in use
```bash
# Check what's using port 7042
lsof -i :7042

# Use different port
PORT=8042 ./scripts/start-agent.sh
```

### Service won't start
```bash
# Check logs
tail -f /var/log/workstation/workstation-agent.log

# Verify build
npm run build

# Check dependencies
npm install
```

### GitHub token error
```bash
# Verify token
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user

# Set token
export GITHUB_TOKEN=your_token
```

## 💡 Tips

1. **Authentication**: Always include `Authorization: Bearer $TOKEN` header
2. **Testing**: Use `/auth/demo-token` for quick testing
3. **Workflows**: Chain operations (commit → push → PR)
4. **Errors**: Check response body for detailed error messages
5. **Logs**: Monitor logs for debugging

## 🌐 URL

**Local**: http://localhost:7042
**Health**: http://localhost:7042/health
**Token**: http://localhost:7042/auth/demo-token

---

For complete documentation, see [CODING_AGENT.md](CODING_AGENT.md)
