# ❓ Frequently Asked Questions (FAQ)

**Quick answers to common questions about Workstation**

---

## General Questions

### What is Workstation?

Workstation is a privacy-first browser automation platform that combines:
- JWT-authenticated REST API
- Playwright-based browser control
- Workflow orchestration engine
- Chrome extension for natural language automation
- Visual workflow builder
- Docker deployment ready

It's perfect for web scraping, form automation, E2E testing, monitoring, and data collection.

### Is Workstation free?

Yes! Workstation is open-source software licensed under the ISC license. You can use it freely for personal and commercial projects.

### What's the difference between Workstation and Selenium/Puppeteer?

| Feature | Workstation | Selenium | Puppeteer |
|---------|-------------|----------|-----------|
| **API** | ✅ REST API | ❌ No built-in API | ❌ No built-in API |
| **Authentication** | ✅ JWT auth | ❌ None | ❌ None |
| **Workflow Engine** | ✅ Built-in | ❌ None | ❌ None |
| **Chrome Extension** | ✅ Included | ❌ None | ❌ None |
| **Visual Builder** | ✅ Included | ❌ None | ❌ None |
| **Browser Support** | ✅ Chromium, Firefox, WebKit | ✅ All browsers | ✅ Chrome only |
| **Learning Curve** | Low (API-based) | High (code-based) | Medium (code-based) |

**Use Workstation when**: You want a complete platform with API, auth, and UI.  
**Use Selenium when**: You need broad browser support and custom coding.  
**Use Puppeteer when**: You want low-level Chrome control in Node.js code.

### Can I use Workstation in production?

Yes! Workstation is production-ready with:
- ✅ 189 passing tests (94%+ coverage target)
- ✅ Security headers (Helmet)
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ Error handling
- ✅ Docker deployment
- ✅ Health monitoring

Many users run Workstation in production for web scraping and automation tasks.

---

## Installation & Setup

### Do I need Docker to use Workstation?

No. Docker is optional. You can run Workstation with:
1. **Local Node.js** (recommended for development)
2. **Docker** (recommended for production)
3. **Railway** (cloud deployment)

### What are the minimum system requirements?

- **Node.js**: v18.0.0 or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Why won't the server start?

The most common cause is a missing or invalid `JWT_SECRET`. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then add it to your `.env` file. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more solutions.

### Do I need a database?

Workstation works out-of-the-box with **SQLite** (no setup required). For production, you can optionally use **PostgreSQL**.

---

## Downloads & Installation

### Where can I download the Chrome extension?

Three ways:
1. **Dashboard**: Visit `http://localhost:3000/dashboard.html` and click the download button
2. **Direct URL**: `http://localhost:3000/downloads/chrome-extension.zip`
3. **Build from source**: `npm run build:chrome`

### Why are download files missing (404 errors)?

You need to generate the download artifacts first:

```bash
npm run build:downloads
```

This creates the ZIP files in `public/downloads/`.

### Can I install the Chrome extension from the Chrome Web Store?

Not yet. Currently, you need to load it as an "unpacked extension" in developer mode. Chrome Web Store publishing is planned for future releases.

### How do I update the Chrome extension?

1. Download the latest ZIP file
2. Extract to the **same location** as before
3. Go to `chrome://extensions/`
4. Click the **refresh icon** on the Workstation extension
5. Extension updated! 🚀

---

## Usage & Features

### How do I create my first workflow?

**Option 1: Visual Builder**
1. Open `http://localhost:3000/workflow-builder.html`
2. Drag nodes from the left panel
3. Connect them by dragging between connection points
4. Save as JSON file

**Option 2: Chrome Extension**
1. Install the extension
2. Click the extension icon
3. Use natural language: "Navigate to google.com and take a screenshot"
4. Click Execute

**Option 3: API**
```bash
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')

curl -X POST http://localhost:3000/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "description": "Navigate to a website",
    "definition": {
      "tasks": [{
        "name": "navigate",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": {"url": "https://example.com"}
      }]
    }
  }'
```

### What browser automation actions are supported?

Workstation supports 7 core actions:

1. **navigate** - Go to a URL
2. **click** - Click an element
3. **type** - Type text into a field
4. **getText** - Extract text from an element
5. **screenshot** - Capture page screenshot
6. **getContent** - Get full page HTML
7. **evaluate** - Execute custom JavaScript

See [API.md](../../API.md) for detailed documentation.

### Can I run workflows in parallel?

Not yet, but it's planned for Phase 2 (DAG-based scheduling). Currently, workflows run sequentially.

### How do I schedule workflows to run automatically?

You can use:
1. **Cron jobs** (Linux/Mac): `0 0 * * * curl -X POST http://localhost:3000/api/v2/workflows/{id}/execute -H "Authorization: Bearer $TOKEN"`
2. **Windows Task Scheduler**: Create a task that runs a script
3. **GitHub Actions** (for cloud deployments): See `.github/workflows/` examples

### Can I use Workstation for web scraping?

Yes! Workstation is excellent for web scraping. Use the `getText` and `getContent` actions to extract data from websites.

**Example workflow**:
```json
{
  "tasks": [
    {"action": "navigate", "parameters": {"url": "https://example.com"}},
    {"action": "getText", "parameters": {"selector": "h1"}},
    {"action": "getContent", "parameters": {}}
  ]
}
```

---

## Authentication & Security

### How do I get a JWT token?

**Demo Token** (quick testing):
```bash
curl http://localhost:3000/auth/demo-token
```

**Custom Token** (production):
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"myuser","expiresIn":"24h"}'
```

### How long are JWT tokens valid?

Default: **24 hours**. You can customize this in `.env`:

```bash
JWT_EXPIRATION=7d  # 7 days
# or
JWT_EXPIRATION=1h  # 1 hour
```

### Can I use my own authentication system?

Yes. Workstation's JWT authentication can be integrated with:
- OAuth2 providers (Google, GitHub, etc.)
- LDAP/Active Directory
- Custom user databases

You'll need to modify `src/auth/jwt.ts` to integrate with your system.

### Is my data secure?

Yes. Workstation implements:
- ✅ **JWT authentication** - Secure API access
- ✅ **Rate limiting** - Prevent abuse (20 downloads/15min)
- ✅ **Security headers** - Helmet middleware (CSP, HSTS, XSS)
- ✅ **IP anonymization** - GDPR-compliant logging
- ✅ **CORS protection** - Configurable origin whitelist
- ✅ **Input validation** - Joi schemas

### Can I disable authentication for testing?

Not recommended for production, but for local development you can:
1. Use the demo token endpoint (no credentials required)
2. Set a very long expiration time
3. Modify the authentication middleware (advanced)

---

## Troubleshooting

### Why can't the Chrome extension connect to the server?

Check:
1. **Server is running**: `curl http://localhost:3000/health`
2. **Correct URL in extension settings**: Should be `http://localhost:3000` (no trailing slash)
3. **CORS is configured**: Ensure `localhost:3000` is in `ALLOWED_ORIGINS`
4. **No HTTPS mismatch**: Extension and server must both use HTTP or both use HTTPS

### Workflow failed with "Element not found" error

This usually means the selector couldn't find the element. Try:
1. **Wait for element**: Add `waitForSelector` parameter
2. **Use better selectors**: Prefer IDs and data attributes over classes
3. **Increase timeout**: Set `timeout: 30000` (30 seconds)
4. **Debug**: Set `headless: false` to see the browser

### Downloads are slow or fail

Possible causes:
1. **Rate limiting**: Wait 15 minutes or increase limit
2. **Large files**: Normal for 10MB+ files
3. **Network issues**: Check your connection
4. **Server overload**: Check CPU/RAM usage

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

## Deployment

### Can I deploy Workstation to the cloud?

Yes! Deployment options:
1. **Railway** - One-click deploy with button in README
2. **Heroku** - Use Dockerfile
3. **AWS/GCP/Azure** - Use Docker or Node.js
4. **DigitalOcean** - Use Docker droplet
5. **Fly.io** - Use Docker

See [DEPLOYMENT.md](../architecture/DEPLOYMENT.md) for guides.

### Do I need a domain name?

No. You can use:
- **localhost:3000** (local development)
- **IP address** (e.g., `http://192.168.1.100:3000`)
- **Cloud provider URL** (e.g., Railway provides a URL)
- **Custom domain** (optional, via reverse proxy)

### How do I set up HTTPS?

For production, use a reverse proxy:

**Option 1: nginx**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

**Option 2: Caddy**
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically handles SSL certificates via Let's Encrypt!

### Can I run multiple instances?

Yes, but note:
- **SQLite**: Each instance needs its own database file
- **PostgreSQL**: All instances can share the same database
- **Rate limiting**: Currently in-memory (not shared between instances)

For true horizontal scaling, use PostgreSQL and Redis for shared rate limiting.

---

## Development

### Can I contribute to Workstation?

Yes! Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### How do I run tests?

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests only
npm test -- tests/e2e/
```

### How do I add a new browser action?

1. Add action to `src/automation/agents/core/browser.ts`
2. Add TypeScript types
3. Write tests in `tests/automation/`
4. Update API documentation
5. Submit pull request

Example:
```typescript
async function newAction(params: NewActionParams): Promise<void> {
  // Implementation
}
```

### Where are the logs stored?

Logs are stored in:
- **Console**: `stdout` (visible when running with `npm start`)
- **Files**: `logs/server.log` (if Winston is configured)
- **Docker**: `docker logs <container-id>`

To view logs:
```bash
# Real-time
tail -f logs/server.log

# Last 50 lines
tail -50 logs/server.log

# Search for errors
grep -i error logs/server.log
```

---

## Advanced Topics

### Can I use Workstation with TypeScript?

Yes! Workstation is built with TypeScript. The source code in `src/` is TypeScript, and all types are exported.

### Can I extend Workstation with custom agents?

Yes! Create custom agents by:
1. Implementing the Agent interface
2. Registering in `src/automation/agents/core/registry.ts`
3. Using in workflows

Example:
```typescript
class CustomAgent implements Agent {
  async execute(params: any): Promise<any> {
    // Custom logic
  }
}
```

### Does Workstation support webhooks?

Not yet, but it's planned for Phase 3. You can currently:
- Poll for workflow completion via API
- Set up custom webhook forwarding
- Use workflow results to trigger HTTP requests

### Can I integrate Workstation with Slack/Discord?

Not built-in yet, but you can:
1. Use the `evaluate` action to post to webhooks
2. Create a custom integration agent
3. Use Zapier/n8n to connect Workstation API to Slack

Slack integration is planned for Phase 3.

---

## Billing & Licensing

### Is there a paid version?

No. Workstation is completely free and open-source. There are no premium features or paid tiers.

### What license is Workstation under?

**ISC License** - You can use, modify, and distribute Workstation freely, including in commercial projects.

### Can I sell services built with Workstation?

Yes! You can build and sell services using Workstation. The ISC license allows commercial use.

---

## Need More Help?

### Documentation

- 📖 [Installation Guide](INSTALLATION_GUIDE.md)
- 🔧 [Troubleshooting Guide](TROUBLESHOOTING.md)
- 🔌 [API Documentation](../../API.md)
- 🏗️ [Architecture Guide](../architecture/ARCHITECTURE.md)

### Support Channels

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- 📧 **Email**: support@workstation.dev (if available)

### Community

- ⭐ **Star the repo**: https://github.com/creditXcredit/workstation
- 🤝 **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- 🗣️ **Discussions**: Join our community forum

---

**Can't find your question?** Ask in [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)!

---

**Last Updated**: 2025-11-23  
**Version**: 1.0.0  
**Maintained By**: Documentation Team
