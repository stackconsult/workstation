# Setup Steps - Module 1

## Step 1: Clone the Repository

```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
```

**What This Does:**
- Downloads the complete workstation codebase
- Sets up local Git repository
- Prepares project for local development

## Step 2: Install Dependencies

```bash
npm install
```

**What This Installs:**
- Express.js for REST API server
- Playwright for browser automation
- TypeScript compiler and type definitions
- JWT authentication libraries
- Database drivers (SQLite/PostgreSQL)
- Testing frameworks (Jest)

**Expected Output:**
```
added 847 packages, and audited 848 packages in 45s
```

## Step 3: Install Playwright Browsers

```bash
npx playwright install --with-deps
```

**What This Does:**
- Downloads Chromium, Firefox, and WebKit browsers
- Installs system dependencies for browser automation
- Required for all browser agent functionality

**Expected Output:**
```
Downloading Chromium 119.0.6045.9...
Downloading Firefox 119.0...
Downloading Webkit 17.4...
```

## Step 4: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set required variables:

```bash
# Generate a secure JWT secret (REQUIRED)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and add to .env:
JWT_SECRET=your_generated_secret_here
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=development
```

**Security Note:**
- Never use `JWT_SECRET=changeme` in production
- Generate a new secret for each environment
- Keep secrets out of version control

## Step 5: Build the Project

```bash
npm run build
```

**What This Does:**
- Compiles TypeScript to JavaScript
- Copies schema files to dist/
- Validates type correctness

**Expected Output:**
```
> stackbrowseragent@1.0.0 build
> tsc && npm run copy-assets
```

## Step 6: Start the Development Server

```bash
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
Environment: development
JWT Configuration: HS256, expires in 24h
```

## Step 7: Verify the Installation

Open a new terminal and run:

```bash
# Health check
curl http://localhost:3000/health

# Get a demo token
curl http://localhost:3000/auth/demo-token

# Test authenticated endpoint
TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/protected
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-19T17:00:00.000Z",
  "uptime": 42
}
```

## Docker Setup (Optional)

### Build Docker Image

```bash
docker build -t workstation:latest .
```

### Run Container

```bash
# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Run container
docker run -d \
  --name workstation \
  -p 3000:3000 \
  -e JWT_SECRET=$JWT_SECRET \
  -e NODE_ENV=production \
  --restart unless-stopped \
  workstation:latest
```

### Verify Docker Deployment

```bash
docker logs workstation
curl http://localhost:3000/health
```

## Docker Compose (Recommended for Production)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Node Version Issues

```bash
# Check Node version
node --version

# Install/use Node 18+
nvm install 18
nvm use 18
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix permissions
chmod -R 755 .
```

### Playwright Installation Fails

```bash
# Install system dependencies manually
npx playwright install-deps

# Retry browser installation
npx playwright install
```

### Build Failures

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Validation Checklist

Before proceeding to Module 2, verify:

- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Can generate demo JWT token
- [ ] Authenticated requests work
- [ ] Browser automation tests pass (if applicable)
- [ ] Docker deployment works (if using Docker)

## Next Steps

✅ Environment configured and validated

→ Proceed to [Module 2: Architecture Deep Dive](../module-2-architecture/README.md)

## Business Context

**For Agencies:**
- Repeatable setup process for client deployments
- Documented environment configuration
- Validated with automated tests

**For Founders:**
- Fast onboarding for development team
- Production-ready from day one
- Infrastructure as code

**For Platform Engineers:**
- Standardized deployment process
- Container-first architecture
- Health check monitoring

**For Senior Developers:**
- Clear development workflow
- TypeScript build validation
- E2E test coverage

## Common pitfalls and how to fix them

- **`npm install` fails with native module errors (SQLite, better-sqlite3):**  
  Make sure you are on Node 18+ and have a working build toolchain (Python + build-essential on Linux, Xcode tools on macOS, or the recommended Windows build tools). If the error mentions `node-gyp`, reinstall dependencies after fixing your toolchain.

- **`npm run dev` starts but `/health` returns 500 or times out:**  
  Check that your `.env` file matches `.env.example` and that `DATABASE_PATH` is writable. If the DB schema has not been applied, run `sqlite3 $DATABASE_PATH < schema.sql` and restart the server.

- **CORS or network errors from the Chrome extension hitting `http://localhost:3000`:**  
  Confirm `host_permissions` in `manifest.json` include your backend origin, and that there are no proxy or VPN rules intercepting localhost calls. For Codespaces, use the forwarded port URL and update the host in your extension config.

- **JWT token endpoint returns 401/403:**  
  Ensure the signing key is set in `.env` and that the `/auth/demo-token` route is wired up to the same secret used by the main auth middleware. Regenerate tokens after any secret or config change.
