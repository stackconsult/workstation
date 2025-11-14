#!/bin/bash

# Railway Deployment Script for stackBrowserAgent
# Automates deployment to Railway with proper configuration

set -e  # Exit on error

echo "🚀 Railway Deployment Script for stackBrowserAgent"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo "  Or: bash <(curl -fsSL cli.new/railway)"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"

# Login check
echo ""
echo "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo "Logging in..."
    railway login
else
    echo -e "${GREEN}✅ Already logged in to Railway${NC}"
fi

# Check if project exists
echo ""
echo "Checking for existing Railway project..."
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No Railway project linked${NC}"
    echo "Initializing new Railway project..."
    railway init
else
    echo -e "${GREEN}✅ Railway project already linked${NC}"
fi

# Add PostgreSQL if not exists
echo ""
echo "Checking for PostgreSQL database..."
if ! railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found${NC}"
    echo "Adding PostgreSQL database..."
    railway add --database postgres
    echo -e "${GREEN}✅ PostgreSQL added${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL already configured${NC}"
fi

# Generate JWT secret if not exists
echo ""
echo "Checking JWT_SECRET_KEY..."
if ! railway variables get JWT_SECRET_KEY &> /dev/null; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY not found${NC}"
    JWT_SECRET=$(openssl rand -hex 32)
    echo "Generating and setting JWT_SECRET_KEY..."
    railway variables set JWT_SECRET_KEY="$JWT_SECRET"
    echo -e "${GREEN}✅ JWT_SECRET_KEY configured${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET_KEY already set${NC}"
fi

# Set required environment variables
echo ""
echo "Setting required environment variables..."
railway variables set JWT_ALGORITHM=HS256 \
    ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    REFRESH_TOKEN_EXPIRE_DAYS=7 \
    ENVIRONMENT=production \
    LOG_LEVEL=info \
    CORS_ORIGINS="*"

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Optional: Prompt for API keys
echo ""
echo "Optional: Configure LLM/RAG API keys"
read -p "Do you want to set OPENAI_API_KEY? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter OPENAI_API_KEY: " openai_key
    railway variables set OPENAI_API_KEY="$openai_key"
    echo -e "${GREEN}✅ OPENAI_API_KEY set${NC}"
fi

echo ""
read -p "Do you want to set PINECONE_API_KEY? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter PINECONE_API_KEY: " pinecone_key
    railway variables set PINECONE_API_KEY="$pinecone_key"
    read -p "Enter PINECONE_ENVIRONMENT: " pinecone_env
    railway variables set PINECONE_ENVIRONMENT="$pinecone_env"
    echo -e "${GREEN}✅ Pinecone configured${NC}"
fi

# Deploy
echo ""
echo "Deploying to Railway..."
echo "This may take 2-3 minutes for first deployment..."
railway up

# Wait for deployment
echo ""
echo "Waiting for deployment to complete..."
sleep 10

# Get deployment URL
echo ""
echo "Getting deployment URL..."
RAILWAY_URL=$(railway variables get RAILWAY_STATIC_URL 2>/dev/null || railway domain 2>/dev/null || echo "")

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically get URL${NC}"
    echo "Get your URL with: railway open"
else
    echo -e "${GREEN}✅ Deployment URL: https://$RAILWAY_URL${NC}"
    
    # Verify health
    echo ""
    echo "Verifying deployment health..."
    sleep 5  # Give it a moment to start
    
    if curl -sf "https://$RAILWAY_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check pending (application may still be starting)${NC}"
    fi
fi

# Print summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. View your app: railway open"
echo "2. View logs: railway logs"
echo "3. Check status: railway status"
echo "4. View metrics: https://railway.app (dashboard)"
echo ""
echo "API Documentation:"
if [ -n "$RAILWAY_URL" ]; then
    echo "  Swagger UI: https://$RAILWAY_URL/docs"
    echo "  ReDoc: https://$RAILWAY_URL/redoc"
fi
echo ""
echo "Configure Chrome Extension:"
echo "  Backend URL: https://$RAILWAY_URL"
echo ""
echo "Useful commands:"
echo "  railway logs           - View application logs"
echo "  railway logs --tail    - Stream logs in real-time"
echo "  railway connect        - Connect to PostgreSQL"
echo "  railway open           - Open app in browser"
echo "  railway status         - Check deployment status"
echo ""

# Create local config file with deployment info
echo ""
echo "Saving deployment configuration..."
cat > .railway-deployment << EOF
RAILWAY_DEPLOYMENT_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
RAILWAY_URL=$RAILWAY_URL
RAILWAY_PROJECT=$(railway status 2>/dev/null | grep "Project:" | cut -d: -f2 | xargs || echo "unknown")
EOF

echo -e "${GREEN}✅ Deployment info saved to .railway-deployment${NC}"
echo ""
echo -e "${GREEN}All done! Your backend is live on Railway! 🚀${NC}"
