# Authentication Guide

## Overview

stackBrowserAgent uses JWT (JSON Web Tokens) for authentication and supports API keys for programmatic access.

## User Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password",
    "username": "myusername"
  }'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

## User Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'
```

## Using JWT Tokens

Include the access token in the Authorization header:

```bash
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Token Refresh

Access tokens expire after 30 minutes. Use the refresh token to get a new access token:

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

## API Keys

Generate an API key for programmatic access:

```bash
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Use the API key in requests:

```bash
curl -X GET http://localhost:8000/api/tasks \
  -H "X-API-Key: YOUR_API_KEY"
```

## Security Best Practices

1. **Never commit API keys or JWT secrets to version control**
2. **Use HTTPS in production**
3. **Rotate API keys regularly**
4. **Set strong JWT_SECRET_KEY in environment variables**
5. **Implement rate limiting per user**

## Environment Variables

```bash
JWT_SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Chrome Extension Integration

Configure the extension to use authentication:

```typescript
// In extension settings
const config = {
  backendUrl: 'http://localhost:8000',
  accessToken: 'YOUR_JWT_TOKEN'
};

// Make authenticated requests
const response = await fetch(`${config.backendUrl}/api/tasks`, {
  headers: {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json'
  }
});
```
