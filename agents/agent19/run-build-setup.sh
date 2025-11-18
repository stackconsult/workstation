#!/bin/bash
# Agent 19: Deployment Manager - Build Setup Script
# This script initializes the deployment automation infrastructure

set -e  # Exit on error

echo "🚀 Agent 19: Deployment Manager - Build Setup"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "agent-prompt.yml" ]; then
  echo "❌ Error: agent-prompt.yml not found. Run from agents/agent19/"
  exit 1
fi

echo "📦 Step 1: Initializing Node.js project..."
if [ ! -f "package.json" ]; then
  npm init -y
  echo "✅ package.json created"
else
  echo "⚠️  package.json already exists, skipping..."
fi

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install --save \
  dockerode \
  @octokit/rest \
  winston \
  axios \
  dotenv \
  commander \
  chalk \
  ora

echo ""
echo "📦 Step 3: Installing dev dependencies..."
npm install --save-dev \
  typescript \
  @types/node \
  @types/dockerode \
  ts-node \
  nodemon \
  jest \
  @types/jest \
  ts-jest \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier

echo ""
echo "📁 Step 4: Creating directory structure..."
mkdir -p src/deployers
mkdir -p src/strategies
mkdir -p src/monitors
mkdir -p src/notifications
mkdir -p src/utils
mkdir -p workflows
mkdir -p configs
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p logs
mkdir -p .github/workflows
echo "✅ Directory structure created"

echo ""
echo "⚙️  Step 5: Creating TypeScript configuration..."
if [ ! -f "tsconfig.json" ]; then
  cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
  echo "✅ tsconfig.json created"
else
  echo "⚠️  tsconfig.json already exists, skipping..."
fi

echo ""
echo "🧪 Step 6: Creating Jest configuration..."
if [ ! -f "jest.config.js" ]; then
  cat > jest.config.js <<'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF
  echo "✅ jest.config.js created"
else
  echo "⚠️  jest.config.js already exists, skipping..."
fi

echo ""
echo "🔧 Step 7: Creating environment template..."
if [ ! -f ".env.example" ]; then
  cat > .env.example <<'EOF'
# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Railway (optional)
RAILWAY_TOKEN=your_railway_token

# Vercel (optional)
VERCEL_TOKEN=your_vercel_token

# Docker Registry (optional)
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_password

# AWS (optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# GCP (optional)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Monitoring
HEALTH_CHECK_TIMEOUT=30000
HEALTH_CHECK_RETRIES=3
ROLLBACK_THRESHOLD=0.05
MONITORING_DURATION=300000
EOF
  echo "✅ .env.example created"
else
  echo "⚠️  .env.example already exists, skipping..."
fi

echo ""
echo "📋 Step 8: Creating deployment config template..."
if [ ! -f "configs/deployment.example.json" ]; then
  cat > configs/deployment.example.json <<'EOF'
{
  "service": {
    "name": "workstation-api",
    "version": "1.0.0"
  },
  "strategy": "rolling",
  "platform": "railway",
  "environment": "production",
  "healthCheck": {
    "url": "https://api.workstation.dev/health",
    "timeout": 30000,
    "retries": 3
  },
  "rollback": {
    "automatic": true,
    "threshold": 0.05,
    "timeout": 300000
  },
  "notifications": {
    "slack": "https://hooks.slack.com/services/xxx"
  }
}
EOF
  echo "✅ configs/deployment.example.json created"
else
  echo "⚠️  configs/deployment.example.json already exists, skipping..."
fi

echo ""
echo "🔄 Step 9: Creating GitHub Actions workflow templates..."
if [ ! -f ".github/workflows/deploy-staging.yml" ]; then
  cat > .github/workflows/deploy-staging.yml <<'EOF'
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to staging
        run: |
          cd agents/agent19
          npm run deploy -- --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
EOF
  echo "✅ .github/workflows/deploy-staging.yml created"
fi

echo ""
echo "✨ Agent 19 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Configure platform credentials (Railway, Vercel, etc.)"
echo "  3. Review configs/deployment.example.json"
echo "  4. Test deployment: npm run deploy:test"
echo "  5. Deploy to staging: npm run deploy:staging"
echo ""
echo "Integration points:"
echo "  - Agent 1: Deploy API updates"
echo "  - Agent 5: Docker orchestration"
echo "  - Agent 8: Performance monitoring"
echo "  - Agent 10: Pre-deployment security scans"
echo "  - Agent 12: Quality gates"
echo "  - Agent 18: Deploy community hub"
