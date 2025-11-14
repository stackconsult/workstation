# Quick Start Guide

Get stackBrowserAgent running in less than 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

### Option 1: Clone from GitHub (Development)

```bash
# Clone the repository
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and set your JWT_SECRET
nano .env  # or your favorite editor

# Start in development mode
npm run dev
```

Your server is now running at `http://localhost:3000`!

### Option 2: Install from npm (Production)

```bash
# Install the package
npm install stackbrowseragent

# Create a simple server file
cat > server.js << 'EOF'
require('dotenv').config();
const app = require('stackbrowseragent');
// Server starts automatically
EOF

# Create .env file
cat > .env << 'EOF'
JWT_SECRET=your-secure-secret-key
JWT_EXPIRATION=24h
PORT=3000
EOF

# Run the server
node server.js
```

### Option 3: One-Click Deploy to Railway

1. Click this button: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/stackconsult/stackBrowserAgent)
2. Railway automatically builds and deploys
3. Access your API at the provided URL

### Option 4: Docker

```bash
# Build the image
docker build -t stackbrowseragent .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secure-secret \
  stackbrowseragent
```

## First Steps

### 1. Verify Installation

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T23:52:00.000Z"
}
```

### 2. Get a Test Token

```bash
curl http://localhost:3000/auth/demo-token
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Use this token for testing..."
}
```

### 3. Access Protected Route

Save the token from step 2, then:

```bash
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/protected
```

Expected response:
```json
{
  "message": "Access granted to protected resource",
  "user": {
    "userId": "demo-user",
    "role": "user",
    "iat": 1762905472,
    "exp": 1762991872
  }
}
```

## Quick Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function quickStart() {
  // 1. Get token
  const { data: { token } } = await axios.get(`${BASE_URL}/auth/demo-token`);
  console.log('Token:', token);
  
  // 2. Use token
  const { data } = await axios.get(`${BASE_URL}/api/protected`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Protected data:', data);
}

quickStart();
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000'

# 1. Get token
token = requests.get(f'{BASE_URL}/auth/demo-token').json()['token']
print(f'Token: {token}')

# 2. Use token
headers = {'Authorization': f'Bearer {token}'}
data = requests.get(f'{BASE_URL}/api/protected', headers=headers).json()
print(f'Protected data: {data}')
```

### cURL Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# Get token
TOKEN=$(curl -s $BASE_URL/auth/demo-token | jq -r .token)
echo "Token: $TOKEN"

# Test protected route
curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/api/protected | jq .
```

## Environment Variables

Create a `.env` file with these variables:

```env
# Required in production
JWT_SECRET=your-super-secure-secret-key-min-32-chars

# Optional
JWT_EXPIRATION=24h        # Token lifetime (1h, 7d, 30d, etc.)
PORT=3000                 # Server port
NODE_ENV=development      # Environment (development/production)
```

### Generate Secure Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

This runs the server with ts-node and auto-reloads on changes.

### 2. Lint Code

```bash
npm run lint
```

### 3. Build for Production

```bash
npm run build
```

Compiles TypeScript to `dist/` folder.

### 4. Run Production Build

```bash
npm start
```

Runs the compiled JavaScript from `dist/`.

### 5. Run Tests

```bash
./test.sh
```

Runs the test suite with 7 test cases.

## Common Tasks

### Generate a Custom Token

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin","role":"admin"}'
```

### Check Agent Status

```bash
TOKEN="your-token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/agent/status
```

### Test Rate Limiting

```bash
# This will hit rate limit after 10 requests
for i in {1..15}; do
  echo "Request $i:"
  curl http://localhost:3000/auth/demo-token
  echo ""
done
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Token Not Working

```bash
# Verify token structure
echo "your-token" | cut -d. -f2 | base64 -d | jq .

# Check expiration
# Look for "exp" field (Unix timestamp)
```

### Build Fails

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. **Read Full Documentation**
   - [README.md](README.md) - Overview and features
   - [API.md](API.md) - Complete API reference
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design

2. **Customize Your Agent**
   - Add new routes in `src/index.ts`
   - Extend JWT payload in `src/auth/jwt.ts`
   - Add database integration
   - Implement OAuth providers

3. **Deploy to Production**
   - See [PUBLISHING.md](PUBLISHING.md) for deployment guides
   - Set strong `JWT_SECRET`
   - Enable HTTPS
   - Configure monitoring

4. **Contribute**
   - See [CONTRIBUTING.md](CONTRIBUTING.md)
   - Open issues for bugs
   - Submit pull requests

## Support

- **Documentation**: See docs folder
- **Issues**: https://github.com/stackconsult/stackBrowserAgent/issues
- **Discussions**: https://github.com/stackconsult/stackBrowserAgent/discussions

## Quick Reference

```bash
# Commands
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm start           # Run production server
npm run lint        # Check code quality
./test.sh           # Run tests

# Endpoints
GET  /health              # Health check
GET  /auth/demo-token     # Get test token
POST /auth/token          # Generate custom token
GET  /api/protected       # Protected example
GET  /api/agent/status    # Agent status

# Default Credentials
Port: 3000
Token expiration: 24h
Rate limit: 100 req/15min (general), 10 req/15min (auth)
```

---

**You're all set!** 🚀

Happy coding with stackBrowserAgent!
