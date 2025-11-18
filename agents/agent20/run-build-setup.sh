#!/bin/bash
# Agent 20: Master Orchestrator - Build Setup Script
# This script initializes the master orchestration infrastructure

set -e  # Exit on error

echo "🚀 Agent 20: Master Orchestrator - Build Setup"
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "agent-prompt.yml" ]; then
  echo "❌ Error: agent-prompt.yml not found. Run from agents/agent20/"
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
echo "📦 Step 2: Installing core dependencies..."
npm install --save \
  express \
  bull \
  redis \
  ioredis \
  pg \
  ws \
  winston \
  dotenv \
  commander \
  chalk \
  yaml \
  prom-client

echo ""
echo "📦 Step 3: Installing dev dependencies..."
npm install --save-dev \
  typescript \
  @types/node \
  @types/express \
  @types/ws \
  ts-node \
  nodemon \
  jest \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier

echo ""
echo "📁 Step 4: Creating directory structure..."
mkdir -p src/orchestrator
mkdir -p src/workflows
mkdir -p src/agents
mkdir -p src/messaging
mkdir -p src/state
mkdir -p src/api
mkdir -p src/dashboard
mkdir -p src/utils
mkdir -p workflows
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p logs
mkdir -p data
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
# Master Orchestrator Configuration
NODE_ENV=production
PORT=3020

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/orchestrator
REDIS_URL=redis://localhost:6379

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_URL=http://localhost:3000

# Agent Registry
AGENT_REGISTRY_URL=http://localhost:3021

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Workflow Settings
MAX_CONCURRENT_WORKFLOWS=1000
WORKFLOW_TIMEOUT=3600000
RETRY_MAX_ATTEMPTS=3

# Security
JWT_SECRET=your-jwt-secret-change-in-production
API_KEY=your-api-key-change-in-production
EOF
  echo "✅ .env.example created"
else
  echo "⚠️  .env.example already exists, skipping..."
fi

echo ""
echo "📋 Step 8: Creating example workflow..."
if [ ! -f "workflows/example-build.yml" ]; then
  cat > workflows/example-build.yml <<'EOF'
name: Complete Project Build
version: 1.0.0
description: Build, test, and deploy a complete project

steps:
  - id: scaffold
    agent: agent6
    action: scaffold_project
    params:
      template: typescript-api
      name: "{{projectName}}"
  
  - id: build_api
    agent: agent1
    action: create_api
    depends_on:
      - scaffold
  
  - id: quality_checks
    parallel:
      - id: code_quality
        agent: agent7
        action: code_quality_check
      
      - id: security_scan
        agent: agent10
        action: security_scan
      
      - id: performance_test
        agent: agent8
        action: performance_test
    
    depends_on:
      - build_api
  
  - id: deploy
    agent: agent19
    action: deploy
    params:
      environment: "{{environment}}"
    depends_on:
      - quality_checks
    condition: "quality_checks.success && security_scan.passed"

error_handling:
  retry:
    max_attempts: 3
    backoff: exponential
  on_failure:
    - agent: agent9
      action: log_error
    - notify: slack
EOF
  echo "✅ workflows/example-build.yml created"
else
  echo "⚠️  workflows/example-build.yml already exists, skipping..."
fi

echo ""
echo "🎨 Step 9: Creating dashboard template..."
if [ ! -f "src/dashboard/index.html" ]; then
  cat > src/dashboard/index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Orchestrator Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .stat-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 2em; font-weight: bold; color: #2563eb; }
    .stat-label { color: #666; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Master Orchestrator Dashboard</h1>
  </div>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value" id="total-workflows">0</div>
      <div class="stat-label">Total Workflows</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="active-workflows">0</div>
      <div class="stat-label">Active Workflows</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="healthy-agents">0/20</div>
      <div class="stat-label">Healthy Agents</div>
    </div>
  </div>
  <script>
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3020');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      document.getElementById('total-workflows').textContent = data.totalWorkflows || 0;
      document.getElementById('active-workflows').textContent = data.activeWorkflows || 0;
      document.getElementById('healthy-agents').textContent = 
        `${data.healthyAgents || 0}/20`;
    };
  </script>
</body>
</html>
EOF
  echo "✅ src/dashboard/index.html created"
fi

echo ""
echo "✨ Agent 20 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Setup PostgreSQL database"
echo "  3. Setup Redis server"
echo "  4. Review workflows/example-build.yml"
echo "  5. Start orchestrator: npm start"
echo "  6. Access dashboard: http://localhost:3020/dashboard"
echo ""
echo "Integration points:"
echo "  - ALL AGENTS (1-19): Full coordination and orchestration"
echo "  - Agent 1: API gateway integration"
echo "  - Agent 5: Container orchestration"
echo "  - Agent 8: Metrics aggregation"
echo "  - Agent 19: Deployment coordination"
echo ""
echo "🎉 Master Orchestrator is the command center for all 20 agents!"
