#!/bin/bash
# Setup Railway Environment Variables
# Usage: ./scripts/setup-railway-env.sh

set -e

echo "🔧 Railway Environment Configuration"
echo "===================================="

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install: https://docs.railway.app/develop/cli"
    exit 1
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)

# Set variables
echo "Setting environment variables..."

railway variables set JWT_SECRET_KEY="$JWT_SECRET"
railway variables set ENVIRONMENT="production"
railway variables set LOG_LEVEL="INFO"
railway variables set CORS_ORIGINS='["https://your-domain.com"]'

echo ""
echo "✅ Core variables set!"
echo ""
echo "JWT_SECRET_KEY: ********** (hidden)"
echo "ENVIRONMENT: production"
echo ""

# Optional variables
read -p "Do you have an OpenAI API key? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter OpenAI API key: " OPENAI_KEY
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
    echo "✅ OpenAI API key set"
fi

read -p "Do you have a Pinecone API key? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Pinecone API key: " PINECONE_KEY
    read -p "Enter Pinecone environment: " PINECONE_ENV
    read -p "Enter Pinecone index name: " PINECONE_INDEX
    
    railway variables set PINECONE_API_KEY="$PINECONE_KEY"
    railway variables set PINECONE_ENVIRONMENT="$PINECONE_ENV"
    railway variables set PINECONE_INDEX_NAME="$PINECONE_INDEX"
    echo "✅ Pinecone configuration set"
fi

echo ""
echo "📋 Current variables:"
railway variables

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next: railway up"
