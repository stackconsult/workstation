#!/bin/bash
# Agent 16: Data Processor - Build Setup Script
# This script initializes the data processor infrastructure

set -e  # Exit on error

echo "🚀 Agent 16: Data Processor - Build Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "agent-prompt.yml" ]; then
  echo "❌ Error: agent-prompt.yml not found. Run from agents/agent16/"
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
  joi \
  zod \
  winston \
  better-sqlite3 \
  csv-parser \
  fast-csv \
  xml2js

echo ""
echo "📦 Step 3: Installing dev dependencies..."
npm install --save-dev \
  typescript \
  @types/node \
  @types/better-sqlite3 \
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
mkdir -p src/processors
mkdir -p src/validators
mkdir -p src/transformers
mkdir -p src/loaders
mkdir -p src/utils
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/fixtures
mkdir -p data/input
mkdir -p data/output
mkdir -p logs
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
echo "✨ Agent 16 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review agent-prompt.yml for specifications"
echo "  2. Implement data processors in src/"
echo "  3. Run tests: npm test"
echo "  4. Build: npm run build"
echo ""
echo "Integration points:"
echo "  - Agent 8: Performance monitoring"
echo "  - Agent 11: Data analytics"
echo "  - Agent 12: Quality assurance"
echo "  - Agent 15: API integration"
echo "  - Agent 19: Deployment automation"
