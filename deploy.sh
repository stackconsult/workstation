#!/bin/bash

# stackBrowserAgent Railway Deployment Script
# Complete automated deployment to Railway with PostgreSQL

set -e  # Exit on any error

echo "🚀 stackBrowserAgent Railway Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://railway.app/install.sh | sh
    else
        echo -e "${RED}Please install Railway CLI manually: npm i -g @railway/cli${NC}"
        exit 1
    fi
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Railway. Opening login...${NC}"
    railway login
fi

echo -e "${BLUE}✓ Railway CLI ready${NC}"
echo ""

# Initialize or link project
echo -e "${BLUE}Step 1: Initialize Railway project${NC}"
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}No railway.json found. Creating new project...${NC}"
    railway init
else
    echo -e "${GREEN}✓ Railway project already initialized${NC}"
fi
echo ""

# Add PostgreSQL if not exists
echo -e "${BLUE}Step 2: Configure PostgreSQL database${NC}"
if ! railway variables | grep -q "DATABASE_URL"; then
    echo -e "${YELLOW}Adding PostgreSQL database...${NC}"
    railway add --database postgres
    echo -e "${GREEN}✓ PostgreSQL added${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL already configured${NC}"
fi
echo ""

# Set environment variables
echo -e "${BLUE}Step 3: Configure environment variables${NC}"

# Check if JWT_SECRET_KEY exists
if ! railway variables get JWT_SECRET_KEY &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${YELLOW}Setting JWT_SECRET_KEY...${NC}"
    railway variables set JWT_SECRET_KEY="$JWT_SECRET"
    echo -e "${GREEN}✓ JWT_SECRET_KEY set${NC}"
else
    echo -e "${GREEN}✓ JWT_SECRET_KEY already set${NC}"
fi

# Set other variables
railway variables set ENVIRONMENT=production || true
railway variables set LOG_LEVEL=INFO || true
railway variables set MAX_WORKERS=20 || true

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Optional: Set API keys if provided
echo -e "${BLUE}Optional: Configure API keys${NC}"
read -p "Do you have an OpenAI API key? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter OpenAI API key: " OPENAI_KEY
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
    echo -e "${GREEN}✓ OpenAI API key set${NC}"
fi

read -p "Do you have a Pinecone API key? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Pinecone API key: " PINECONE_KEY
    read -p "Enter Pinecone environment: " PINECONE_ENV
    railway variables set PINECONE_API_KEY="$PINECONE_KEY"
    railway variables set PINECONE_ENVIRONMENT="$PINECONE_ENV"
    echo -e "${GREEN}✓ Pinecone configured${NC}"
fi
echo ""

# Deploy
echo -e "${BLUE}Step 4: Deploy to Railway${NC}"
echo -e "${YELLOW}Starting deployment...${NC}"
railway up

echo ""
echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

# Wait for deployment
echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
sleep 30

# Get URL
RAILWAY_URL=$(railway domain || echo "")
if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}Getting deployment URL...${NC}"
    RAILWAY_URL=$(railway status | grep "URL" | awk '{print $2}' || echo "")
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

if [ -n "$RAILWAY_URL" ]; then
    echo -e "${BLUE}Backend URL:${NC} $RAILWAY_URL"
    echo ""
    
    # Verify deployment
    echo -e "${BLUE}Verifying deployment...${NC}"
    if curl -f -s "$RAILWAY_URL/health" > /dev/null; then
        echo -e "${GREEN}✓ Backend is healthy!${NC}"
        echo ""
        echo -e "${BLUE}API Documentation:${NC} $RAILWAY_URL/docs"
        echo -e "${BLUE}Health Check:${NC} $RAILWAY_URL/health"
        echo -e "${BLUE}Metrics:${NC} $RAILWAY_URL/metrics"
    else
        echo -e "${YELLOW}⚠ Backend is starting up...${NC}"
        echo "Check logs: railway logs"
    fi
else
    echo -e "${YELLOW}Could not determine backend URL automatically.${NC}"
    echo "Check Railway dashboard: railway open"
fi

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Create first user: curl -X POST $RAILWAY_URL/api/auth/register ..."
echo "2. Configure Chrome extension backend URL"
echo "3. Test integration"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "• View logs: railway logs"
echo "• Check status: railway status"
echo "• Open dashboard: railway open"
echo "• View variables: railway variables"
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
