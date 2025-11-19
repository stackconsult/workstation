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
