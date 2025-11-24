#!/bin/bash
# Agent 18: Community Hub - Build Setup Script
# This script initializes the community platform infrastructure

set -e  # Exit on error

echo "🚀 Agent 18: Community Hub - Build Setup"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "agent-prompt.yml" ]; then
  echo "❌ Error: agent-prompt.yml not found. Run from agents/agent18/"
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
echo "📦 Step 2: Installing backend dependencies..."
npm install --save \
  express \
  socket.io \
  pg \
  redis \
  passport \
  passport-github2 \
  passport-google-oauth20 \
  jsonwebtoken \
  bcrypt \
  helmet \
  cors \
  express-rate-limit \
  winston \
  dotenv

echo ""
echo "📦 Step 3: Installing dev dependencies..."
npm install --save-dev \
  typescript \
  @types/node \
  @types/express \
  @types/passport \
  @types/bcrypt \
  @types/jsonwebtoken \
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
mkdir -p src/api
mkdir -p src/models
mkdir -p src/services
mkdir -p src/middleware
mkdir -p src/utils
mkdir -p tests/api
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p logs
mkdir -p uploads
echo "✅ Backend directory structure created"

echo ""
echo "⚛️  Step 5: Setting up React frontend..."
if [ ! -d "frontend" ]; then
  echo "Creating React app with TypeScript template..."
  npx create-react-app frontend --template typescript
  cd frontend
  npm install --save \
    socket.io-client \
    react-router-dom \
    @types/react-router-dom \
    axios \
    react-markdown \
    react-syntax-highlighter \
    @types/react-syntax-highlighter
  cd ..
  echo "✅ Frontend created"
else
  echo "⚠️  frontend/ already exists, skipping..."
fi

echo ""
echo "⚙️  Step 6: Creating TypeScript configuration..."
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
  "exclude": ["node_modules", "dist", "tests", "frontend"]
}
EOF
  echo "✅ tsconfig.json created"
else
  echo "⚠️  tsconfig.json already exists, skipping..."
fi

echo ""
echo "🧪 Step 7: Creating Jest configuration..."
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
echo "🔧 Step 8: Creating environment template..."
if [ ! -f ".env.example" ]; then
  cat > .env.example <<'EOF'
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/community
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@community.dev

# Search (optional)
ELASTICSEARCH_URL=http://localhost:9200

# Frontend URL
FRONTEND_URL=http://localhost:3000
EOF
  echo "✅ .env.example created"
else
  echo "⚠️  .env.example already exists, skipping..."
fi

echo ""
echo "✨ Agent 18 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Setup PostgreSQL database"
echo "  3. Setup Redis server"
echo "  4. Configure OAuth apps (GitHub, Google)"
echo "  5. Start backend: npm run dev"
echo "  6. Start frontend: cd frontend && npm start"
echo ""
echo "Integration points:"
echo "  - Agent 1: API gateway integration"
echo "  - Agent 8: Performance monitoring"
echo "  - Agent 10: Security scanning"
echo "  - Agent 11: Analytics integration"
echo "  - Agent 15: Third-party integrations"
echo "  - Agent 19: Deployment automation"
