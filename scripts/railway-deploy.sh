#!/bin/bash
# Railway Deployment Script for stackBrowserAgent
# Usage: ./scripts/railway-deploy.sh

set -e

echo "🚀 stackBrowserAgent Railway Deployment"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "📦 Installing Railway CLI..."
    
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://railway.app/install.sh | sh
    else
        echo "Please install Railway CLI manually: https://docs.railway.app/develop/cli"
        exit 1
    fi
fi

echo "✅ Railway CLI found"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Not logged in to Railway"
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "🔗 Project not linked to Railway"
    echo "Initializing new Railway project..."
    
    railway init
    
    echo ""
    echo "📦 Adding PostgreSQL database..."
    railway add --database postgresql
    
    echo ""
    echo "🔧 Please set environment variables in Railway dashboard:"
    echo "   1. Go to: https://railway.app/project"
    echo "   2. Select your project"
    echo "   3. Go to Variables tab"
    echo "   4. Add these variables:"
    echo "      - JWT_SECRET_KEY (generate with: openssl rand -hex 32)"
    echo "      - ENVIRONMENT=production"
    echo "      - OPENAI_API_KEY (optional)"
    echo "      - PINECONE_API_KEY (optional)"
    echo ""
    read -p "Press Enter after setting variables..."
fi

echo "✅ Project linked"

# Generate JWT secret if not exists
if ! railway variables | grep -q "JWT_SECRET_KEY"; then
    echo "🔐 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    railway variables set JWT_SECRET_KEY=$JWT_SECRET
    echo "✅ JWT secret set"
fi

# Set environment to production
railway variables set ENVIRONMENT=production

# Deploy
echo ""
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
DOMAIN=$(railway domain 2>/dev/null || echo "")

if [ -n "$DOMAIN" ]; then
    echo "🌐 Your API is live at: https://$DOMAIN"
    echo ""
    echo "🧪 Testing health endpoint..."
    sleep 5  # Wait for deployment
    
    if curl -s "https://$DOMAIN/health" | grep -q "healthy"; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed - deployment may still be starting"
    fi
else
    echo "⚠️  No domain configured yet"
    echo "Run: railway domain"
fi

echo ""
echo "📊 View logs: railway logs"
echo "📈 View dashboard: railway open"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure Chrome extension with your Railway URL"
echo "2. Create admin user (see RAILWAY_DEPLOYMENT.md)"
echo "3. Generate API key for extension"
echo "4. Test integration"
