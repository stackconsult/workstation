# Production Deployment Guide

## Pre-Deployment Checklist

### Security Configuration

- [ ] **JWT Secret**: Generate and set a strong JWT_SECRET
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **HTTPS**: Ensure HTTPS is enabled (use Railway, Heroku, or reverse proxy)

- [ ] **CORS**: Configure allowed origins (don't use `*` in production)
  ```env
  ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
  ```

- [ ] **Rate Limiting**: Review and adjust rate limits based on expected traffic

- [ ] **Environment Variables**: All secrets stored securely (not in code)

### Application Configuration

- [ ] **NODE_ENV**: Set to `production`
  ```env
  NODE_ENV=production
  ```

- [ ] **Port**: Configure based on deployment platform
  ```env
  PORT=3000  # Railway/Heroku set this automatically
  ```

- [ ] **JWT Expiration**: Set appropriate token expiration
  ```env
  JWT_EXPIRATION=24h  # or 1h, 7d, etc.
  ```

### Dependencies

- [ ] Run security audit
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] Update dependencies
  ```bash
  npm update
  npm outdated  # Check for major updates
  ```

- [ ] Lock dependency versions
  ```bash
  npm install  # Updates package-lock.json
  ```

### Testing

- [ ] All tests pass
  ```bash
  npm test
  ```

- [ ] Build succeeds
  ```bash
  npm run build
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  ```

- [ ] Integration tests pass
  ```bash
  npm run test:integration
  ```

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides the easiest deployment with automatic HTTPS, environment management, and zero-configuration deployments.

#### Quick Deploy

1. **One-Click Deploy**
   - Click: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/stackconsult/stackBrowserAgent)
   - Railway automatically configures everything

2. **Manual Deploy**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   ```

3. **Configure Environment Variables**
   - Go to Railway dashboard
   - Navigate to your project → Variables
   - Add:
     - `JWT_SECRET`: Your secure secret
     - `JWT_EXPIRATION`: Token lifetime (e.g., "24h")
     - `NODE_ENV`: "production"

4. **Custom Domain** (Optional)
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

#### Railway Configuration

The repository includes `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 2: Docker

#### Production Dockerfile

The included `Dockerfile` uses multi-stage builds for optimization:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Build and Run

```bash
# Build image
docker build -t stackbrowseragent:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-secret-here" \
  -e JWT_EXPIRATION="24h" \
  -e NODE_ENV="production" \
  --name stackbrowseragent \
  --restart unless-stopped \
  stackbrowseragent:latest
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=24h
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
JWT_SECRET="your-secret" docker-compose up -d
```

### Option 3: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET="your-secret-here"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 4: AWS (ECS/Fargate)

1. **Build and push Docker image to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
   docker build -t stackbrowseragent .
   docker tag stackbrowseragent:latest your-account.dkr.ecr.us-east-1.amazonaws.com/stackbrowseragent:latest
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/stackbrowseragent:latest
   ```

2. **Create ECS Task Definition**
   - Set environment variables
   - Configure health checks
   - Set resource limits

3. **Create ECS Service**
   - Use Application Load Balancer
   - Configure auto-scaling
   - Set up CloudWatch logging

### Option 5: DigitalOcean App Platform

1. Connect GitHub repository
2. Set environment variables
3. Choose deployment region
4. Deploy automatically on push

### Option 6: VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Create .env file
cat > .env << EOF
JWT_SECRET=your-secret-here
NODE_ENV=production
PORT=3000
EOF

# Start with PM2
pm2 start dist/index.js --name stackbrowseragent

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup

# Setup nginx reverse proxy (optional)
# See nginx configuration below
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/stackbrowseragent`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and install SSL:
```bash
sudo ln -s /etc/nginx/sites-available/stackbrowseragent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | `abc123...` (32+ chars) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRATION` | Token expiration time | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

### Platform-Specific

#### Railway
- `PORT`: Auto-set by Railway
- `RAILWAY_ENVIRONMENT`: Set by Railway

#### Heroku
- `PORT`: Auto-set by Heroku
- `DYNO`: Set by Heroku

#### AWS
- Configure via Systems Manager Parameter Store or Secrets Manager

## Post-Deployment

### Verify Deployment

1. **Health Check**
   ```bash
   curl https://your-domain.com/health
   ```

2. **Get Demo Token**
   ```bash
   curl https://your-domain.com/auth/demo-token
   ```

3. **Test Protected Route**
   ```bash
   TOKEN="your-demo-token"
   curl -H "Authorization: Bearer $TOKEN" https://your-domain.com/api/protected
   ```

### Monitoring Setup

1. **Health Check Monitoring**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Monitor `/health` endpoint
   - Alert on failures

2. **Log Aggregation**
   - Configure log shipping (Papertrail, LogDNA, CloudWatch)
   - Set up log alerts for errors
   - Implement log rotation

3. **Performance Monitoring**
   - APM tool (New Relic, DataDog, Sentry)
   - Monitor response times
   - Track error rates

4. **Security Monitoring**
   - Monitor failed authentication attempts
   - Track rate limit hits
   - Set up anomaly detection

### Backup and Recovery

1. **Code Backup**
   - Git repository is the source of truth
   - Tag releases: `git tag v1.0.0`

2. **Configuration Backup**
   - Document environment variables
   - Store securely (password manager, secret manager)

3. **Recovery Plan**
   - Document rollback procedure
   - Test recovery process
   - Keep previous versions deployed

### Maintenance

1. **Regular Updates**
   ```bash
   npm update
   npm audit
   npm run test
   ```

2. **Security Patches**
   - Subscribe to security advisories
   - Apply patches promptly
   - Test before deploying

3. **Dependency Management**
   - Monthly dependency review
   - Quarterly major updates
   - Use Dependabot for automation

## Performance Optimization

### Production Optimizations

1. **Compression**
   ```bash
   npm install compression
   ```

   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Caching**
   - Cache responses where appropriate
   - Use ETags for conditional requests
   - Configure CDN for static assets

3. **Connection Pooling**
   - If using a database, configure connection pooling
   - Reuse connections

4. **Process Management**
   - Use PM2 or similar for process management
   - Enable cluster mode for multi-core systems
   ```bash
   pm2 start dist/index.js -i max
   ```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test
ab -n 1000 -c 10 https://your-domain.com/health
```

Or use Artillery:
```bash
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com/health
```

## Scaling Strategies

### Vertical Scaling
- Increase instance size/resources
- Railway: Upgrade plan
- AWS: Change instance type

### Horizontal Scaling
- Add more instances
- Use load balancer
- Consider stateless design (JWT is stateless)

### Rate Limiting at Scale
- Use Redis-backed rate limiting
- Sync rate limits across instances

```bash
npm install rate-limit-redis
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Ensure `npm run build` was run
   - Check `dist/` folder exists
   - Verify NODE_ENV is set correctly

2. **Rate limit too restrictive**
   - Adjust limits in `src/index.ts`
   - Consider IP whitelisting
   - Use Redis for distributed rate limiting

3. **Memory leaks**
   - Monitor memory usage
   - Restart periodically (PM2 can do this)
   - Use `--max-old-space-size` flag if needed

4. **High CPU usage**
   - Profile application
   - Check for infinite loops
   - Optimize heavy operations

### Debug Production Issues

```bash
# View logs (Railway)
railway logs

# View logs (Heroku)
heroku logs --tail

# View logs (PM2)
pm2 logs stackbrowseragent

# View logs (Docker)
docker logs stackbrowseragent
```

## Rollback Procedure

### Railway
1. Go to Deployments tab
2. Select previous deployment
3. Click "Redeploy"

### Heroku
```bash
heroku rollback
```

### Docker
```bash
docker stop stackbrowseragent
docker rm stackbrowseragent
docker run -d ... stackbrowseragent:previous-tag
```

### VPS with PM2
```bash
git checkout previous-tag
npm install
npm run build
pm2 restart stackbrowseragent
```

## Support

- **Documentation**: Review all `.md` files in repository
- **Issues**: Open GitHub issue
- **Security**: See SECURITY.md for reporting vulnerabilities

---

**Ready to deploy? Start with Railway for the easiest experience!**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/stackconsult/stackBrowserAgent)
