# API Documentation

Complete API reference for stackBrowserAgent.

## Base URL

- **Local Development**: `http://localhost:3000`
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
