#!/bin/bash

# stackBrowserAgent - Railway Deployment Script
# This script automates the complete Railway deployment process

set -e  # Exit on error

echo "🚀 stackBrowserAgent Railway Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    echo ""
    echo "Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI found${NC}"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Railway${NC}"
    echo "Logging in..."
    railway login
fi

echo -e "${GREEN}✓ Logged in to Railway${NC}"

# Check if project exists
if ! railway status &> /dev/null; then
    echo ""
    echo -e "${YELLOW}📦 Initializing new Railway project${NC}"
    railway init
    
    echo ""
    echo -e "${YELLOW}🗄️  Adding PostgreSQL database${NC}"
    railway add --plugin postgresql
    
    echo -e "${GREEN}✓ PostgreSQL added${NC}"
else
    echo -e "${GREEN}✓ Railway project already initialized${NC}"
fi

# Generate JWT secret if not exists
if ! railway variables get JWT_SECRET_KEY &> /dev/null; then
    echo ""
    echo -e "${YELLOW}🔐 Generating JWT secret${NC}"
    JWT_SECRET=$(openssl rand -hex 32)
    railway variables set JWT_SECRET_KEY="$JWT_SECRET"
    echo -e "${GREEN}✓ JWT secret generated and set${NC}"
fi

# Set default environment variables
echo ""
echo -e "${YELLOW}⚙️  Configuring environment variables${NC}"

railway variables set ENVIRONMENT=production || true
railway variables set LOG_LEVEL=info || true
railway variables set JWT_ALGORITHM=HS256 || true
railway variables set ACCESS_TOKEN_EXPIRE_MINUTES=30 || true
railway variables set REFRESH_TOKEN_EXPIRE_DAYS=7 || true
railway variables set PLAYWRIGHT_HEADLESS=true || true
railway variables set PROMETHEUS_ENABLED=true || true

echo -e "${GREEN}✓ Environment variables configured${NC}"

# Check if optional API keys should be set
echo ""
read -p "Do you want to configure OpenAI API key? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter OpenAI API key: " openai_key
    railway variables set OPENAI_API_KEY="$openai_key"
    echo -e "${GREEN}✓ OpenAI API key set${NC}"
fi

echo ""
read -p "Do you want to configure Pinecone? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Pinecone API key: " pinecone_key
    read -p "Enter Pinecone environment (e.g., us-east-1-aws): " pinecone_env
    railway variables set PINECONE_API_KEY="$pinecone_key"
    railway variables set PINECONE_ENVIRONMENT="$pinecone_env"
    echo -e "${GREEN}✓ Pinecone configured${NC}"
fi

# Deploy
echo ""
echo -e "${YELLOW}🚀 Deploying to Railway${NC}"
echo "This may take 2-3 minutes for the first deployment..."
echo ""

railway up

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"

# Get deployment URL
echo ""
echo "📍 Getting deployment URL..."
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠ No domain configured yet${NC}"
    echo "Generate one with: railway domain"
else
    echo -e "${GREEN}✓ Your backend is deployed at:${NC}"
    echo "   $RAILWAY_URL"
    
    # Test health endpoint
    echo ""
    echo "🏥 Testing health endpoint..."
    sleep 5  # Wait for service to be ready
    
    if curl -s "$RAILWAY_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}✓ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠ Health check pending (service may still be starting)${NC}"
        echo "   Check status with: railway logs"
    fi
fi

# Show next steps
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. View logs:"
echo "   railway logs --follow"
echo ""
echo "2. Check status:"
echo "   railway status"
echo ""
echo "3. Get deployment URL (if not shown above):"
echo "   railway domain"
echo ""
echo "4. Add custom domain (optional):"
echo "   railway domain add yourdomain.com"
echo ""
echo "5. Update Chrome extension backend URL:"
echo "   Edit src/config/backend.ts with your Railway URL"
echo ""
echo "6. Configure CORS for extension:"
echo "   railway variables set CORS_ORIGINS='[\"chrome-extension://your-id\"]'"
echo ""
echo "7. Test the API:"
if [ -n "$RAILWAY_URL" ]; then
    echo "   curl $RAILWAY_URL/health"
    echo "   curl $RAILWAY_URL/api/status"
fi
echo ""
echo "📚 Full deployment guide: RAILWAY_DEPLOYMENT.md"
echo ""
