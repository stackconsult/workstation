# stackBrowserAgent Railway Template

This template deploys a secure Browser Agent with JWT authentication on Railway.

## Features

- 🔐 JWT Authentication
- 🚀 Express API Server
- 📝 TypeScript
- 🐳 Docker Ready

## Environment Variables

Configure these in your Railway project:

- `JWT_SECRET` (required): Your secure JWT secret key
- `JWT_EXPIRATION` (optional): Token expiration time (default: "24h")
- `PORT` (auto-configured by Railway)

## Quick Start

After deployment:

1. Visit `/auth/demo-token` to get a test JWT token
2. Use the token in Authorization header: `Bearer <token>`
3. Access protected routes like `/api/protected` or `/api/agent/status`

## API Endpoints

- `GET /health` - Health check
- `GET /auth/demo-token` - Get demo JWT token
- `POST /auth/token` - Generate custom token
- `GET /api/protected` - Protected route (requires JWT)
- `GET /api/agent/status` - Agent status (requires JWT)

## Documentation

See the main README.md for full documentation.
