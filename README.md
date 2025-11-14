# stackBrowserAgent

Browser Agent with JWT Authentication and Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)

## Features

- 🔐 JWT Authentication with Express
- 🚀 One-click deployment to Railway
- 🐳 Docker containerization
- 📝 TypeScript for type safety
- ⚡ Fast development with ts-node
- 🛡️ Rate limiting for security (100 req/15min, 10 auth req/15min)
- ✅ Comprehensive test suite with Jest (94% coverage)
- 🔍 Input validation with Joi schemas
- 📊 Structured logging with Winston
- 🏥 Enhanced health checks with system metrics
- 🚨 Global error handling
- 🤖 CI/CD with GitHub Actions
- 🔒 **Security Headers** with Helmet (CSP, HSTS, XSS protection)
- 🌐 **CORS Protection** with configurable origin whitelist
- 🛡️ **JWT Algorithm Validation** prevents 'none' algorithm attacks
- 🔐 **Input Sanitization** prevents XSS in user data
- 🕵️ **Privacy-First Logging** with IP anonymization

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# JWT Configuration (REQUIRED in production)
JWT_SECRET=your-secure-32-character-minimum-secret-key
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

**Security Note**: Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Run in development mode:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
npm start
```

7. Run tests:
```bash
npm test
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### Run Integration Tests Only
```bash
npm test:integration
```

### Test Coverage
The project includes comprehensive test coverage:
- Unit tests for JWT authentication
- Integration tests for all API endpoints
- 94%+ code coverage

Test results and coverage reports are generated in the `coverage/` directory.

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate Demo Token
```bash
GET /auth/demo-token
```
Returns a demo JWT token for testing.

### Generate Custom Token
```bash
POST /auth/token
Content-Type: application/json

{
  "userId": "user123",
  "role": "admin"
}
```

### Protected Route Example
```bash
GET /api/protected
Authorization: Bearer <your-jwt-token>
```

### Agent Status (Protected)
```bash
GET /api/agent/status
Authorization: Bearer <your-jwt-token>
```

## Railway Deployment

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/stackconsult/stackBrowserAgent)

Click the button above to deploy instantly to Railway. The deployment will:
- Automatically build the TypeScript application
- Generate a secure JWT secret (or you can provide your own)
- Expose the API on a public URL

After deployment:
1. Railway will automatically set a `JWT_SECRET` for you
2. Your application will be available at: `https://your-app.railway.app`
3. Test it: `https://your-app.railway.app/health`
4. Get a demo token: `https://your-app.railway.app/auth/demo-token`

### Option 2: Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
railway init
railway up
```

4. Set environment variables in Railway dashboard:
   - `JWT_SECRET`: Your secure secret key
   - `JWT_EXPIRATION`: Token expiration time (e.g., "24h")
   - `PORT`: Will be set automatically by Railway

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | `default-secret...` | Yes (in production) |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` | No |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |

## Testing JWT Authentication

1. Get a demo token:
```bash
curl http://localhost:3000/auth/demo-token
```

2. Use the token to access protected routes:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t stackbrowseragent .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  stackbrowseragent
```

## Security Notes

⚠️ **Important**: Always set a strong `JWT_SECRET` in production. Never use the default value.

### Security Features (v1.1.0+)

This application implements comprehensive security measures:

#### 🔐 JWT Security
- **Algorithm Validation**: Only HS256, HS384, and HS512 algorithms accepted
- **Production Enforcement**: JWT_SECRET is required in production (minimum 32 characters)
- **Input Sanitization**: User IDs sanitized to prevent XSS attacks
- **Short Expiration**: 24-hour default token lifetime

#### 🛡️ HTTP Security Headers
Implemented via Helmet middleware:
- **Content-Security-Policy**: Prevents XSS attacks
- **Strict-Transport-Security**: Enforces HTTPS (31536000 seconds)
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Additional XSS protection

#### 🌐 CORS Protection
- **Configurable Origins**: Use `ALLOWED_ORIGINS` environment variable
- **Production Restriction**: No origins allowed by default in production
- **Development Defaults**: localhost:3000, localhost:3001
- **Credential Support**: Enabled for authenticated requests

Example CORS configuration:
```env
# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Allow all (NOT recommended)
ALLOWED_ORIGINS=*
```

#### 🕵️ Privacy & Compliance
- **IP Anonymization**: IPs are hashed (SHA-256) before logging
- **GDPR Compliant**: Follows data minimization principles
- **Secure Error Handling**: No stack traces leaked to clients in production

#### 🔍 Secret Scanning
- **TruffleHog**: Open-source secret scanner (active, no license required)
- **GitHub Native**: Built-in GitHub secret scanning (free to enable)
- **Gitleaks**: Optional commercial scanner (BYOK)
- See [SECRET_SCANNING_SETUP.md](SECRET_SCANNING_SETUP.md) for details

#### 📋 Security Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure ALLOWED_ORIGINS for your domains
- [ ] Enable HTTPS/TLS
- [ ] Review rate limiting settings
- [ ] Set NODE_ENV=production
- [ ] Enable log file rotation
- [ ] Set up monitoring and alerts
- [ ] Review SECURITY.md for complete guidelines

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limiting

The application includes built-in rate limiting for security:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 10 requests per 15 minutes per IP

Rate limits help prevent:
- Brute force attacks on authentication
- Denial of service (DoS) attacks
- API abuse

If you need to adjust rate limits, modify the `limiter` and `authLimiter` configurations in `src/index.ts`.

### Security Documentation

- **[Security Policy](SECURITY.md)** - Complete security guidelines and vulnerability reporting
- **[Secret Scanning Setup](SECRET_SCANNING_SETUP.md)** - Multi-layer secret detection configuration
- **[Security Fixes](SECURITY_FIXES.md)** - Detailed documentation of all security improvements
- **[Rollback Guide](ROLLBACK_GUIDE.md)** - Emergency rollback procedures for security fixes

### Known Limitations

1. **In-Memory Rate Limiting**: Not suitable for multi-instance deployments
   - **Future**: Implement Redis-backed rate limiting

2. **Token Revocation**: JWTs cannot be revoked before expiration
   - **Mitigation**: Use short expiration times (24h default)
   - **Future**: Implement token blacklist with Redis

3. **Session Management**: No built-in refresh token mechanism
   - **Future**: Implement refresh token flow

## Documentation

- **[API Reference](API.md)** - Complete API documentation with examples
- **[Architecture](ARCHITECTURE.md)** - System architecture and design decisions
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions for multiple platforms
- **[Security Policy](SECURITY.md)** - Security best practices and vulnerability reporting
- **[Monitoring Guide](MONITORING.md)** - Observability, logging, and alerting setup
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines
- **[Changelog](CHANGELOG.md)** - Version history and release notes

## Copilot coding agent onboarding

This repository includes a short onboarding guide and a small config for Copilot coding agents.

- Onboarding doc: `.github/COPILOT_ONBOARDING.md` — read this first for the agent contract, commands, and verification checklist.
- Quick config: `.github/copilot-coding-agent.yml` — contains canonical build/test/lint commands and important paths.

If you're a human contributor, follow the same checklist in the onboarding doc before opening a PR.

## Troubleshooting

### Common Issues

**Issue**: `npm run build` fails
- **Solution**: Delete `node_modules` and `dist` folders, then run `npm install && npm run build`

**Issue**: Port 3000 already in use
- **Solution**: Change the `PORT` environment variable or kill the process using port 3000

**Issue**: JWT token expired
- **Solution**: Generate a new token. Default expiration is 24 hours, configurable via `JWT_EXPIRATION`

**Issue**: CORS errors in browser
- **Solution**: CORS is enabled by default. Check your request headers and ensure proper origin

**Issue**: Rate limit exceeded
- **Solution**: Wait 15 minutes or adjust rate limit configuration

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

### Health Check

Always verify the service is running:
```bash
curl http://localhost:3000/health
```

## FAQ

**Q: Can I use this in production?**  
A: Yes, but ensure you set a strong `JWT_SECRET` and use HTTPS.

**Q: How do I change token expiration?**  
A: Set the `JWT_EXPIRATION` environment variable (e.g., "1h", "7d", "30d").

**Q: Can I add custom claims to JWT tokens?**  
A: Yes, pass additional fields in the request body to `/auth/token`.

**Q: How do I revoke a token?**  
A: Currently not supported. Future versions will include token blacklisting with Redis.

**Q: Can I use a database for user management?**  
A: Not yet implemented, but you can extend the codebase to add database integration.

**Q: Is refresh token supported?**  
A: Not in the current version. Planned for future releases.

## Performance

### Benchmarks (Local Development)

- **Health Check**: ~5ms response time
- **Token Generation**: ~10ms response time
- **Token Verification**: ~10ms response time
- **Protected Routes**: ~15ms response time

### Optimization Tips

1. **Use Production Mode**: Set `NODE_ENV=production`
2. **Enable Compression**: Add compression middleware
3. **Use Process Manager**: PM2 for production deployments
4. **Cache Responses**: Add caching layer for frequently accessed data
5. **Monitor Performance**: Use APM tools (New Relic, DataDog)

## Roadmap

### Version 1.x (Current)
- [x] JWT Authentication
- [x] Express API Server
- [x] Rate Limiting
- [x] Railway Deployment
- [x] Docker Support
- [x] TypeScript
- [x] API Documentation

### Version 2.0 (Planned)
- [ ] Database Integration (PostgreSQL)
- [ ] User Registration & Login
- [ ] Refresh Token Support
- [ ] Token Revocation/Blacklisting
- [ ] OAuth Providers (Google, GitHub)
- [ ] WebSocket Support
- [ ] Advanced Logging (Winston)

### Version 3.0 (Future)
- [ ] Browser Automation (Puppeteer/Playwright)
- [ ] UI Dashboard (React + Vite)
- [ ] Task Queue (Bull/BullMQ)
- [ ] Metrics & Monitoring (Prometheus)
- [ ] Multi-tenancy Support
- [ ] API Rate Plans
- [ ] CI/CD Pipelines

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm run lint && npm run build`
5. Commit: `git commit -am 'Add new feature'`
6. Push: `git push origin feature/my-feature`
7. Submit a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/stackconsult/stackBrowserAgent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/stackconsult/stackBrowserAgent/discussions)
- **Email**: Contact the maintainers

## License

ISC

## Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT implementation
- [Railway](https://railway.app/) - Deployment platform

---

**Made with ❤️ by stackconsult**

