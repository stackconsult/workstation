# Workstation Coding Agent Service

## Overview

The Workstation Coding Agent is a REST API service that enables local agents and CLI tools to interact with the GitHub repository programmatically. It provides comprehensive Git operations including branch management, code pushing, pull request creation, and repository synchronization.

## Features

- ✅ **Repository Status**: Get current branch, ahead/behind counts, and file changes
- ✅ **Branch Management**: List all local and remote branches
- ✅ **Code Pushing**: Push current branch to remote with optional force push
- ✅ **Commit Operations**: Stage and commit changes with custom messages
- ✅ **Pull Request Management**: List, create, and manage PRs via GitHub API
- ✅ **Repository Sync**: Automated fetch, merge, and push operations
- ✅ **Secure Authentication**: JWT-based authentication for all operations
- ✅ **Error Handling**: Comprehensive error reporting with conflict detection
- ✅ **Docker Support**: Containerized deployment for local and CI/CD

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Git installed on your system
- GitHub Personal Access Token (for PR operations)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```bash
# Server Configuration
PORT=7042
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-characters-recommended
JWT_EXPIRATION=24h

# GitHub Configuration (required for PR operations)
GITHUB_TOKEN=your-github-personal-access-token
```

#### Generate GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (full control of private repositories)
4. Copy the generated token and add to `.env`

### 3. Start the Service

#### Option A: Manual Start

```bash
npm start
```

#### Option B: Auto-Start Script

```bash
chmod +x scripts/start-agent.sh scripts/stop-agent.sh
./scripts/start-agent.sh
```

#### Option C: Systemd Service (Linux)

```bash
# Copy service file
sudo cp scripts/workstation-agent.service /etc/systemd/system/

# Edit paths in service file if needed
sudo nano /etc/systemd/system/workstation-agent.service

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable workstation-agent
sudo systemctl start workstation-agent

# Check status
sudo systemctl status workstation-agent

# View logs
sudo journalctl -u workstation-agent -f
```

### 4. Verify Installation

```bash
# Check health
curl http://localhost:7042/health

# Get demo token
curl http://localhost:7042/auth/demo-token

# Test status endpoint
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:7042/api/v2/git/status
```

## API Usage

### Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Get Repository Status

```bash
curl http://localhost:7042/api/v2/git/status \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": "main",
    "ahead": 2,
    "behind": 0,
    "files": {
      "staged": ["file1.txt"],
      "modified": ["file2.txt"],
      "untracked": ["file3.txt"]
    },
    "isClean": false
  }
}
```

### List Branches

```bash
curl http://localhost:7042/api/v2/git/branches \
  -H "Authorization: Bearer $TOKEN"
```

### Commit Changes

```bash
# Commit all changes
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Your commit message"}'

# Commit specific files
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Update specific files",
    "files": ["src/file1.ts", "src/file2.ts"]
  }'
```

### Push Current Branch

```bash
# Normal push
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Force push (use with caution)
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### List Pull Requests

```bash
# List open PRs
curl http://localhost:7042/api/v2/git/prs?state=open \
  -H "Authorization: Bearer $TOKEN"

# List all PRs
curl http://localhost:7042/api/v2/git/prs?state=all \
  -H "Authorization: Bearer $TOKEN"
```

### Create Pull Request

```bash
curl -X POST http://localhost:7042/api/v2/git/pr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add new feature",
    "head": "feature-branch",
    "base": "main",
    "body": "This PR adds a new feature.\n\n## Changes\n- Added X\n- Updated Y"
  }'
```

### Sync Repository

```bash
curl -X POST http://localhost:7042/api/v2/git/sync \
  -H "Authorization: Bearer $TOKEN"
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "pulled": true,
    "pushed": true,
    "message": "Sync completed. Pulled: true, Pushed: true"
  }
}
```

**Response (Conflict):**
```json
{
  "success": false,
  "data": {
    "success": false,
    "pulled": false,
    "pushed": false,
    "conflicts": ["src/file1.ts"],
    "message": "Sync failed: CONFLICT (content): Merge conflict in src/file1.ts"
  }
}
```

## Complete Workflow Examples

### Example 1: Make Changes and Push

```bash
#!/bin/bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Check status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7042/api/v2/git/status

# Commit changes
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Implement new feature"}'

# Push to remote
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

### Example 2: Create Feature Branch PR

```bash
#!/bin/bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Commit and push
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add feature implementation"}'

curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Create PR
curl -X POST http://localhost:7042/api/v2/git/pr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add new feature",
    "head": "feature-branch",
    "base": "main",
    "body": "## Description\nThis PR adds a new feature\n\n## Changes\n- Implemented X\n- Added tests"
  }'
```

### Example 3: Keep Branch Updated

```bash
#!/bin/bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Sync with remote (fetch + merge + push)
curl -X POST http://localhost:7042/api/v2/git/sync \
  -H "Authorization: Bearer $TOKEN"
```

## Docker Deployment

### Build and Run Locally

```bash
# Build image
docker build -t workstation-agent .

# Run container
docker run -d \
  --name workstation-agent \
  -p 7042:7042 \
  -e JWT_SECRET=your-secret-key \
  -e GITHUB_TOKEN=your-github-token \
  -e PORT=7042 \
  -v $(pwd):/app \
  workstation-agent
```

### Docker Compose

```yaml
version: '3.8'
services:
  workstation-agent:
    build: .
    ports:
      - "7042:7042"
    environment:
      - NODE_ENV=production
      - PORT=7042
      - JWT_SECRET=${JWT_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    volumes:
      - .:/app
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Coding Agent

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Start agent
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          chmod +x scripts/start-agent.sh
          ./scripts/start-agent.sh
```

## Management Commands

### Start Service

```bash
./scripts/start-agent.sh
```

### Stop Service

```bash
./scripts/stop-agent.sh
```

### View Logs

```bash
# If using start-agent.sh
tail -f /var/log/workstation/workstation-agent.log

# If using systemd
sudo journalctl -u workstation-agent -f
```

### Check Status

```bash
# Check if running
curl http://localhost:7042/health

# Get detailed status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7042/api/v2/git/status
```

## Troubleshooting

### Service Won't Start

1. Check if port 7042 is available:
   ```bash
   lsof -i :7042
   ```

2. Check logs:
   ```bash
   tail -f /var/log/workstation/workstation-agent.log
   ```

3. Verify build:
   ```bash
   npm run build
   ```

### GitHub Token Issues

1. Verify token has correct permissions (repo scope)
2. Test token:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/user
   ```

### Push/Pull Errors

1. Check Git configuration:
   ```bash
   git remote -v
   git config --list
   ```

2. Verify SSH keys or credentials are set up

3. Check repository permissions

### Port Conflicts

If port 7042 is already in use:

1. Change port in `.env`:
   ```bash
   PORT=8042
   ```

2. Or specify when starting:
   ```bash
   PORT=8042 ./scripts/start-agent.sh
   ```

## Security Best Practices

1. **JWT Secret**: Use a strong, random secret (minimum 32 characters)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **GitHub Token**: Store in environment variable, never commit to code
   ```bash
   export GITHUB_TOKEN=your_token
   ```

3. **Rate Limiting**: Service has built-in rate limiting (100 req/15min)

4. **HTTPS**: Use HTTPS in production with reverse proxy (nginx/traefik)

5. **Firewall**: Restrict access to port 7042 to trusted networks

## API Reference

Complete API documentation is available in [API.md](../API.md)

Key endpoints:
- `GET /api/v2/git/status` - Repository status
- `GET /api/v2/git/branches` - List branches
- `POST /api/v2/git/commit` - Commit changes
- `POST /api/v2/git/push` - Push to remote
- `GET /api/v2/git/prs` - List pull requests
- `POST /api/v2/git/pr` - Create pull request
- `POST /api/v2/git/sync` - Sync repository

## Support

- **Documentation**: [Full Documentation](../README.md)
- **API Reference**: [API.md](../API.md)
- **Issues**: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)

## License

ISC License - see [LICENSE](../LICENSE) file for details.
