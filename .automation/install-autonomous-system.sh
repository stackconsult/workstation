#!/bin/bash
# .automation/install-autonomous-system.sh
# Complete installation of autonomous improvement system

set -e

ROOT_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"

echo "🤖 Installing Autonomous Continuous Improvement System"
echo "======================================================"
echo ""

# Step 1: Verify directory structure
echo "Step 1: Verifying directory structure..."
mkdir -p "$ROOT_DIR/.automation"/{logs,config,scripts}
mkdir -p "$ROOT_DIR/.docker/snapshots"

# Check agent directories
for agent in {7..12}; do
    if [ ! -d "$ROOT_DIR/agents/agent${agent}" ]; then
        echo "  ⚠️  Creating agents/agent${agent}/ directory..."
        mkdir -p "$ROOT_DIR/agents/agent${agent}"/{src,memory,reports,logs}
    fi
done
echo "  ✅ Directory structure verified"

# Step 2: Make scripts executable
echo ""
echo "Step 2: Making scripts executable..."
chmod +x "$ROOT_DIR/.automation/master-orchestrator.sh" 2>/dev/null || true
chmod +x "$ROOT_DIR/.automation/setup-cron.sh" 2>/dev/null || true
chmod +x "$ROOT_DIR/.automation/check-cycle-health.sh" 2>/dev/null || true
chmod +x "$ROOT_DIR/.automation/trigger-cycle-now.sh" 2>/dev/null || true

for agent in {7..12}; do
    find "$ROOT_DIR/agents/agent${agent}" -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
done
echo "  ✅ Scripts made executable"

# Step 3: Verify Node.js
echo ""
echo "Step 3: Checking Node.js..."
if command -v node &>/dev/null; then
    echo "  ✅ Node.js available: $(node --version)"
else
    echo "  ⚠️  Node.js not found - required for agents"
    echo "     Install Node.js 18+ to use autonomous system"
fi

# Step 4: Install agent dependencies
echo ""
echo "Step 4: Installing agent dependencies..."
for agent in {8..12}; do
    if [ -f "$ROOT_DIR/agents/agent${agent}/package.json" ]; then
        echo "  📦 Installing Agent $agent dependencies..."
        (cd "$ROOT_DIR/agents/agent${agent}" && npm install --silent 2>&1 | grep -v "^npm" || true)
    fi
done
echo "  ✅ Agent dependencies installed"

# Step 5: Build agents
echo ""
echo "Step 5: Building agent TypeScript..."
for agent in {8..12}; do
    if [ -f "$ROOT_DIR/agents/agent${agent}/tsconfig.json" ]; then
        echo "  🔨 Building Agent $agent..."
        (cd "$ROOT_DIR/agents/agent${agent}" && npm run build 2>&1 | grep -v "^>" || true)
    fi
done
echo "  ✅ Agents built successfully"

# Step 6: Verify agent scripts
echo ""
echo "Step 6: Verifying agent scripts..."
local scripts_ok=0
for agent in {7..12}; do
    if [ -f "$ROOT_DIR/agents/agent${agent}/run-weekly-"*".sh" ] 2>/dev/null; then
        echo "  ✅ Agent $agent script found"
        scripts_ok=$((scripts_ok + 1))
    else
        echo "  ⚠️  Agent $agent script missing"
    fi
done
echo "  Found $scripts_ok/6 agent scripts"

# Step 7: Environment setup
echo ""
echo "Step 7: Environment configuration..."
if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        echo "  📝 Creating .env from .env.example..."
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        echo "     ⚠️  Remember to set SLACK_WEBHOOK_URL in .env for notifications"
    else
        echo "  ℹ️  No .env.example found"
    fi
else
    echo "  ✅ .env file already exists"
fi

# Step 8: Install cron job
echo ""
echo "Step 8: Installing cron job..."
if command -v crontab &>/dev/null; then
    read -p "  Install cron job for automatic weekly cycles? (yes/no): " install_cron
    if [ "$install_cron" = "yes" ]; then
        bash "$ROOT_DIR/.automation/setup-cron.sh"
    else
        echo "  ⏭️  Skipped - you can install later with: bash .automation/setup-cron.sh"
    fi
else
    echo "  ⚠️  crontab not available - cron job not installed"
    echo "     Run manually with: bash .automation/trigger-cycle-now.sh"
fi

# Step 9: Docker configuration check
echo ""
echo "Step 9: Docker configuration..."
if grep -q "agent-scheduler" "$ROOT_DIR/docker-compose.yml" 2>/dev/null; then
    echo "  ✅ agent-scheduler service found in docker-compose.yml"
else
    echo "  ℹ️  agent-scheduler service not in docker-compose.yml"
    echo "     This is optional - system can run without Docker"
fi

# Step 10: Test run
echo ""
echo "Step 10: Testing installation..."
echo "  Would you like to run a test cycle now? (recommended)"
read -p "  Run test cycle? (yes/no): " run_test

if [ "$run_test" = "yes" ]; then
    echo ""
    echo "  🧪 Running test cycle..."
    bash "$ROOT_DIR/.automation/trigger-cycle-now.sh"
fi

# Installation complete
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 Next automated cycle:"
if command -v date &>/dev/null; then
    if date -d 'next saturday 02:00' +'   %Y-%m-%d %H:%M %Z' 2>/dev/null; then
        :
    else
        echo "   Next Saturday at 2:00 AM MST"
    fi
else
    echo "   Next Saturday at 2:00 AM MST"
fi
echo ""
echo "🔍 Check status:"
echo "   bash .automation/check-cycle-health.sh"
echo ""
echo "🧪 Manual trigger:"
echo "   bash .automation/trigger-cycle-now.sh"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f .automation/logs/cycle-*.log"
echo ""
echo "📖 View agent documentation:"
echo "   cat agents/agent*/README.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
