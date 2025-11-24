# API Documentation

Complete API reference for stackBrowserAgent.

## Base URL

- **Local Development (Coding Agent)**: `http://localhost:7042`
- **Local Development (Standard)**: `http://localhost:3000`
- **Railway Production**: `https://your-app.railway.app`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

The API implements rate limiting for security:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 10 requests per 15 minutes per IP

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Rate Limit**: 100 requests / 15 minutes

**Request**:
```bash
curl http://localhost:3000/health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T23:52:00.000Z"
}
```

---

### 2. Get Demo Token

Generate a demo JWT token for testing purposes.

**Endpoint**: `GET /auth/demo-token`

**Authentication**: Not required

**Rate Limit**: 10 requests / 15 minutes

**Request**:
```bash
curl http://localhost:3000/auth/demo-token
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Use this token for testing. Add it to Authorization header as: Bearer <token>"
}
```

**Token Payload**:
```json
{
  "userId": "demo-user",
  "role": "user",
  "iat": 1762905472,
  "exp": 1762991872
}
```

---

### 3. Generate Custom Token

Create a custom JWT token with specified user data.

**Endpoint**: `POST /auth/token`

**Authentication**: Not required

**Rate Limit**: 10 requests / 15 minutes

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user123",
  "role": "admin"
}
```

**Request Example**:
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","role":"admin"}'
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "userId is required"
}
```

---

### 4. Protected Route (Example)

Example of a protected endpoint requiring authentication.

**Endpoint**: `GET /api/protected`

**Authentication**: Required

**Rate Limit**: 100 requests / 15 minutes

**Request Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Request Example**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/protected
```

**Response** (200 OK):
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

**Error Response** (401 Unauthorized):
```json
{
  "error": "No token provided"
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "Invalid or expired token"
}
```

---

### 5. Agent Status

Get the current status of the browser agent.

**Endpoint**: `GET /api/agent/status`

**Authentication**: Required

**Rate Limit**: 100 requests / 15 minutes

**Request Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Request Example**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/agent/status
```

**Response** (200 OK):
```json
{
  "status": "running",
  "user": {
    "userId": "demo-user",
    "role": "user",
    "iat": 1762905472,
    "exp": 1762991872
  },
  "timestamp": "2025-11-11T23:52:00.000Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "No token provided"
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "Invalid or expired token"
}
```

---

## Downloads API

The Downloads API provides access to build artifacts including the Chrome Extension and Workflow Builder.

### 6. Downloads Health Check

Check the status of the downloads service and available files.

**Endpoint**: `GET /downloads/health`

**Authentication**: Not required

**Rate Limit**: 20 requests / 15 minutes

**Request**:
```bash
curl http://localhost:3000/downloads/health
```

**Response** (200 OK):
```json
{
  "success": true,
  "status": "healthy",
  "downloadsDirectory": true,
  "files": [
    {
      "name": "chrome-extension.zip",
      "exists": true,
      "size": 74766
    },
    {
      "name": "workflow-builder.zip",
      "exists": true,
      "size": 21928
    },
    {
      "name": "manifest.json",
      "exists": true,
      "size": 881
    }
  ],
  "timestamp": "2025-11-23T15:46:59.311Z"
}
```

---

### 7. Download Chrome Extension

Download the latest Chrome Extension build as a zip file.

**Endpoint**: `GET /downloads/chrome-extension.zip`

**Authentication**: Not required

**Rate Limit**: 20 requests / 15 minutes

**Request**:
```bash
curl -O http://localhost:3000/downloads/chrome-extension.zip
```

**Response**: Binary zip file with appropriate headers
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="chrome-extension.zip"`
- `Content-Length: [file size in bytes]`
- `Cache-Control: public, max-age=3600`

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "File not found. Please ensure builds have been generated."
}
```

---

### 8. Download Workflow Builder

Download the latest Workflow Builder build as a zip file.

**Endpoint**: `GET /downloads/workflow-builder.zip`

**Authentication**: Not required

**Rate Limit**: 20 requests / 15 minutes

**Request**:
```bash
curl -O http://localhost:3000/downloads/workflow-builder.zip
```

**Response**: Binary zip file with appropriate headers
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="workflow-builder.zip"`
- `Content-Length: [file size in bytes]`
- `Cache-Control: public, max-age=3600`

---

### 9. Download Manifest

Get version information and metadata for all available downloads.

**Endpoint**: `GET /downloads/manifest.json`

**Authentication**: Not required

**Rate Limit**: 20 requests / 15 minutes

**Request**:
```bash
curl http://localhost:3000/downloads/manifest.json
```

**Response** (200 OK):
```json
{
  "generated": "2025-11-23T15:46:59.311Z",
  "version": "1.0.0",
  "repository": "git+https://github.com/stackconsult/stackBrowserAgent.git",
  "downloads": [
    {
      "name": "chrome-extension.zip",
      "description": "Workstation AI Agent Chrome Extension - Browser automation with natural language",
      "size": 74766,
      "sizeFormatted": "73.01 KB",
      "checksum": "4f49db6bb006f04700d7e19a1b1dbea34e6dd5ec7a6e1a4f0f3f6f1d4e1f8e9a",
      "url": "/downloads/chrome-extension.zip",
      "version": "1.0.0"
    },
    {
      "name": "workflow-builder.zip",
      "description": "Workflow Builder - Visual automation workflow designer",
      "size": 21928,
      "sizeFormatted": "21.41 KB",
      "checksum": "21d69beb0f5e14389c0f8b6e1e8e1c3d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8g9h",
      "url": "/downloads/workflow-builder.zip",
      "version": "1.0.0"
    }
  ]
}
```

**Response Headers**:
- `Content-Type: application/json`
- `Cache-Control: public, max-age=3600`

---

## Building Downloads

To generate the download files, run:

```bash
# Build both Chrome Extension and Workflow Builder zips
npm run build:downloads

# Generate manifest.json with checksums and metadata
npm run generate:manifest
```

Files are built to: `public/downloads/`

---

## Security Features

### File Whitelist
Only the following files can be downloaded:
- `chrome-extension.zip`
- `workflow-builder.zip`
- `manifest.json`

Any attempt to download other files will result in a 404 response.

### Rate Limiting
All download endpoints are protected by rate limiting:
- **Limit**: 20 requests per 15 minutes per IP address
- **Headers**: Standard rate limit headers are included in responses
- **Exceeded**: Returns 429 Too Many Requests with JSON error message

### Privacy
- IP addresses are anonymized (SHA256 hash) in logs
- User-Agent strings are truncated to 100 characters
- Download analytics include only: filename, size, timestamp, anonymized IP

### Caching
Downloads include cache headers to reduce server load:
- `Cache-Control: public, max-age=3600` (1 hour)
- `ETag` based on file modification time and size

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
Invalid request parameters or missing required fields.

### 401 Unauthorized
Authentication token is missing.

### 403 Forbidden
Authentication token is invalid or expired.

### 429 Too Many Requests
Rate limit exceeded. Wait before making more requests.

### 500 Internal Server Error
Server encountered an unexpected error.

---

## Testing the API

### Using cURL

1. **Get a demo token**:
```bash
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)
echo $TOKEN
```

2. **Use the token to access protected routes**:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  // Get demo token
  const tokenResponse = await axios.get(`${BASE_URL}/auth/demo-token`);
  const token = tokenResponse.data.token;
  
  // Access protected route
  const protectedResponse = await axios.get(`${BASE_URL}/api/protected`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log(protectedResponse.data);
}

testAPI();
```

### Using Python

```python
import requests

BASE_URL = 'http://localhost:3000'

# Get demo token
token_response = requests.get(f'{BASE_URL}/auth/demo-token')
token = token_response.json()['token']

# Access protected route
headers = {'Authorization': f'Bearer {token}'}
protected_response = requests.get(f'{BASE_URL}/api/protected', headers=headers)

print(protected_response.json())
```

---

## Git Operations (Coding Agent)

The Git operations API allows local agents and CLI tools to interact with the GitHub repository, manage branches, push code, and handle pull requests. All endpoints require authentication.

### Base Configuration

**Port**: 7042 (configurable via `PORT` environment variable)
**GitHub Token**: Required for PR operations. Set `GITHUB_TOKEN` environment variable with a GitHub Personal Access Token.

#### Generate GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the generated token and set it as `GITHUB_TOKEN` environment variable

---

### 1. Get Repository Status

Get current branch, ahead/behind status, and file changes.

**Endpoint**: `GET /api/v2/git/status`

**Authentication**: Required

**Request**:
```bash
curl http://localhost:7042/api/v2/git/status \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "current": "main",
    "ahead": 2,
    "behind": 0,
    "files": {
      "staged": ["src/services/git.ts"],
      "modified": ["README.md"],
      "untracked": ["temp.txt"]
    },
    "tracking": "origin/main",
    "isClean": false
  }
}
```

---

### 2. List Branches

List all local and remote branches.

**Endpoint**: `GET /api/v2/git/branches`

**Authentication**: Required

**Request**:
```bash
curl http://localhost:7042/api/v2/git/branches \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "name": "main",
      "current": true,
      "commit": "abc123def456",
      "label": "main"
    },
    {
      "name": "remotes/origin/main",
      "current": false,
      "commit": "abc123def456",
      "label": "remotes/origin/main"
    },
    {
      "name": "feature-branch",
      "current": false,
      "commit": "xyz789ghi012",
      "label": "feature-branch"
    }
  ]
}
```

---

### 3. Push Current Branch

Push the current branch to the remote repository.

**Endpoint**: `POST /api/v2/git/push`

**Authentication**: Required

**Request Body**:
```json
{
  "force": false
}
```

**Request**:
```bash
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully pushed branch 'main' to origin"
  }
}
```

**Force Push** (use with caution):
```bash
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

---

### 4. List Pull Requests

List pull requests from GitHub.

**Endpoint**: `GET /api/v2/git/prs?state=<state>`

**Authentication**: Required

**Query Parameters**:
- `state` (optional): `open`, `closed`, or `all` (default: `open`)

**Request**:
```bash
curl http://localhost:7042/api/v2/git/prs?state=open \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "number": 42,
      "title": "Add new feature",
      "state": "open",
      "head": "feature-branch",
      "base": "main",
      "url": "https://github.com/creditXcredit/workstation/pull/42",
      "created_at": "2025-11-19T00:00:00Z",
      "updated_at": "2025-11-19T01:00:00Z",
      "user": "developer"
    }
  ]
}
```

**Error Response** (400 Bad Request - GitHub token not configured):
```json
{
  "success": false,
  "error": "GitHub token not configured",
  "message": "GITHUB_TOKEN environment variable must be set to use this endpoint"
}
```

---

### 5. Create Pull Request

Create a new pull request on GitHub.

**Endpoint**: `POST /api/v2/git/pr`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Add new feature",
  "head": "feature-branch",
  "base": "main",
  "body": "This PR adds a new feature.\n\n## Changes\n- Added feature X\n- Updated docs"
}
```

**Request**:
```bash
curl -X POST http://localhost:7042/api/v2/git/pr \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add new feature",
    "head": "feature-branch",
    "base": "main",
    "body": "This PR adds a new feature."
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "number": 42,
    "title": "Add new feature",
    "state": "open",
    "head": "feature-branch",
    "base": "main",
    "url": "https://github.com/creditXcredit/workstation/pull/42",
    "created_at": "2025-11-19T02:00:00Z",
    "updated_at": "2025-11-19T02:00:00Z",
    "user": "developer"
  }
}
```

---

### 6. Sync Repository

Fetch, merge, and push changes to sync with remote.

**Endpoint**: `POST /api/v2/git/sync`

**Authentication**: Required

**Request**:
```bash
curl -X POST http://localhost:7042/api/v2/git/sync \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK - Success):
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

**Response** (409 Conflict - Dirty working directory):
```json
{
  "success": false,
  "data": {
    "success": false,
    "pulled": false,
    "pushed": false,
    "message": "Working directory is not clean. Commit or stash changes first."
  }
}
```

**Response** (409 Conflict - Merge conflicts):
```json
{
  "success": false,
  "data": {
    "success": false,
    "pulled": false,
    "pushed": false,
    "conflicts": ["src/file1.ts", "src/file2.ts"],
    "message": "Sync failed: CONFLICT (content): Merge conflict in src/file1.ts"
  }
}
```

---

### 7. Commit Changes

Add and commit changes to the repository.

**Endpoint**: `POST /api/v2/git/commit`

**Authentication**: Required

**Request Body**:
```json
{
  "message": "Add new feature implementation",
  "files": ["src/services/git.ts", "src/routes/git.ts"]
}
```

**Note**: If `files` is omitted or empty, all changes will be committed (equivalent to `git add .`).

**Request**:
```bash
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add new feature implementation",
    "files": ["src/services/git.ts"]
  }'
```

**Commit all changes**:
```bash
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Update all files"}'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully committed changes: Add new feature implementation"
  }
}
```

---

### Common Workflow Examples

#### Example 1: Check Status and Push

```bash
# Get JWT token
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Check repository status
curl http://localhost:7042/api/v2/git/status \
  -H "Authorization: Bearer $TOKEN"

# Push current branch
curl -X POST http://localhost:7042/api/v2/git/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

#### Example 2: Create and Push a Pull Request

```bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Commit changes
curl -X POST http://localhost:7042/api/v2/git/commit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Implement new feature"}'

# Push branch
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
    "body": "This PR implements the new feature"
  }'
```

#### Example 3: Sync Repository

```bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# Sync (fetch + merge + push)
curl -X POST http://localhost:7042/api/v2/git/sync \
  -H "Authorization: Bearer $TOKEN"
```

#### Example 4: List All Pull Requests

```bash
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

# List open PRs
curl http://localhost:7042/api/v2/git/prs?state=open \
  -H "Authorization: Bearer $TOKEN"

# List all PRs (open + closed)
curl http://localhost:7042/api/v2/git/prs?state=all \
  -H "Authorization: Bearer $TOKEN"
```

---

## JWT Token Structure

The JWT tokens contain the following payload:

```json
{
  "userId": "string",      // User identifier
  "role": "string",        // User role (optional)
  "iat": 1762905472,       // Issued at (Unix timestamp)
  "exp": 1762991872        // Expires at (Unix timestamp)
}
```

Default expiration: 24 hours (configurable via `JWT_EXPIRATION` env var)

---

## Security Best Practices

1. **Always use HTTPS in production** to protect tokens in transit
2. **Keep JWT_SECRET secure** - never commit it to version control
3. **Rotate JWT_SECRET periodically** for enhanced security
4. **Set appropriate token expiration** based on your security requirements
5. **Implement token refresh** for long-running sessions (future enhancement)
6. **Monitor rate limit violations** to detect potential attacks
7. **Validate user input** on all endpoints

---

## Troubleshooting

### Token Expired Error

**Problem**: Receiving 403 Forbidden with "Invalid or expired token"

**Solution**: Generate a new token. Default expiration is 24 hours.

### Rate Limit Exceeded

**Problem**: Receiving 429 Too Many Requests

**Solution**: Wait 15 minutes before making more requests, or adjust rate limits in production.

### CORS Errors

**Problem**: Cannot access API from browser due to CORS policy

**Solution**: CORS is already enabled. Ensure you're sending requests correctly and check browser console for specific CORS errors.

### Token Not Working

**Problem**: Token doesn't work across environments

**Solution**: Ensure the same `JWT_SECRET` is used in all environments. Tokens generated with one secret won't work with another.

---

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT token decoder and validator
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Railway Documentation](https://docs.railway.app/)

---

## Agent Orchestration API

The Agent Orchestration API provides comprehensive management of the 21+ agents and 20+ MCP containers. All endpoints require JWT authentication.

### Get All Agents

Get list of all registered agents with their current status.

**Endpoint**: `GET /api/agents`

**Authentication**: Required (JWT)

**Request**:
```bash
curl http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "1",
        "name": "browser-automation-agent",
        "type": "browser",
        "containerName": "agent-browser-1",
        "status": "running",
        "healthStatus": "healthy",
        "capabilities": ["navigate", "click", "scrape"],
        "lastHealthCheck": "2024-11-24T18:00:00Z"
      }
    ],
    "total": 21
  }
}
```

---

### Get Agent Details

Get detailed information about a specific agent including statistics.

**Endpoint**: `GET /api/agents/:id`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID

**Request**:
```bash
curl http://localhost:3000/api/agents/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "1",
      "name": "browser-automation-agent",
      "type": "browser",
      "status": "running",
      "healthStatus": "healthy"
    },
    "stats": {
      "total_tasks": "150",
      "completed_tasks": "142",
      "failed_tasks": "5",
      "active_tasks": "3",
      "avg_execution_time_ms": 2500
    }
  }
}
```

---

### Start Agent

Start a stopped agent container.

**Endpoint**: `POST /api/agents/:id/start`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID

**Request**:
```bash
curl -X POST http://localhost:3000/api/agents/1/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Agent 1 started successfully"
}
```

---

### Stop Agent

Stop a running agent container.

**Endpoint**: `POST /api/agents/:id/stop`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID

**Request**:
```bash
curl -X POST http://localhost:3000/api/agents/1/stop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Agent 1 stopped successfully"
}
```

---

### Update Agent Health

Report agent health status and metrics.

**Endpoint**: `POST /api/agents/:id/health`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID

**Request Body**:
```json
{
  "healthStatus": "healthy",
  "metadata": {
    "cpu": "25%",
    "memory": "512MB",
    "uptime": 3600
  }
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/agents/1/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "healthStatus": "healthy",
    "metadata": {"cpu": "25%", "memory": "512MB"}
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Agent 1 health updated to healthy"
}
```

---

### Create Agent Task

Create a new task for an agent to execute.

**Endpoint**: `POST /api/agents/tasks`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "agentId": "1",
  "type": "scrape",
  "payload": {
    "url": "https://example.com",
    "selectors": ["h1", ".content"]
  },
  "priority": 8
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/agents/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "1",
    "type": "scrape",
    "payload": {"url": "https://example.com"},
    "priority": 8
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "taskId": "42",
  "message": "Task created successfully"
}
```

---

### Get Task Status

Get current status and result of a task.

**Endpoint**: `GET /api/agents/tasks/:id`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Task ID

**Request**:
```bash
curl http://localhost:3000/api/agents/tasks/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "42",
    "agent_id": "1",
    "agent_name": "browser-automation-agent",
    "type": "scrape",
    "status": "completed",
    "result": {
      "success": true,
      "data": {
        "title": "Example Domain",
        "content": "..."
      }
    },
    "created_at": "2024-11-24T17:00:00Z",
    "completed_at": "2024-11-24T17:00:03Z"
  }
}
```

---

### Get Agent Tasks

Get all tasks for a specific agent.

**Endpoint**: `GET /api/agents/:id/tasks`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID
- `limit` (query, optional) - Maximum number of tasks (default: 50)

**Request**:
```bash
curl "http://localhost:3000/api/agents/1/tasks?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "42",
        "type": "scrape",
        "status": "completed",
        "created_at": "2024-11-24T17:00:00Z"
      }
    ],
    "total": 150
  }
}
```

---

### Get Agent Statistics

Get performance statistics for an agent.

**Endpoint**: `GET /api/agents/:id/statistics`

**Authentication**: Required (JWT)

**Parameters**:
- `id` (path) - Agent ID

**Request**:
```bash
curl http://localhost:3000/api/agents/1/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_tasks": "150",
    "completed_tasks": "142",
    "failed_tasks": "5",
    "active_tasks": "3",
    "avg_execution_time_ms": 2500
  }
}
```

---

### Get System Overview

Get system-wide overview of all agents and tasks.

**Endpoint**: `GET /api/agents/system/overview`

**Authentication**: Required (JWT)

**Request**:
```bash
curl http://localhost:3000/api/agents/system/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalAgents": 21,
    "runningAgents": 18,
    "stoppedAgents": 3,
    "healthyAgents": 17,
    "degradedAgents": 1,
    "unhealthyAgents": 0,
    "pendingTasks": 12,
    "mcpContainers": 20,
    "agentsByType": {
      "browser": 5,
      "code": 3,
      "mcp": 20
    }
  }
}
```

---

## Route Organization

The API routes are organized as follows:

### `/api/v2` Routes
Multiple subsystems mount at `/api/v2`:
- **Automation**: `/api/v2/automation/*` - Workflow automation
- **MCP**: `/api/v2/mcp/*` - Model Context Protocol endpoints
- **Git**: `/api/v2/git/*` - Git operations
- **GitOps**: `/api/v2/gitops/*` - Advanced Git automation
- **Context Memory**: `/api/v2/context/*` - AI context management

### Other Routes
- **Agent Management**: `/api/agents/*` - Agent orchestration (documented above)
- **Authentication**: `/api/auth/*` - JWT authentication
- **Dashboard**: `/api/dashboard/*` - Dashboard data
- **Workflows**: `/api/workflows/*` - Workflow management
- **Templates**: `/api/workflow-templates/*` - Workflow templates
- **Downloads**: `/downloads/*` - Build artifact downloads

For detailed documentation on orchestration, see [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md)
