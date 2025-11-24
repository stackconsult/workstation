#!/bin/bash

# Test Downloads Endpoint
# Verifies that download files are accessible via HTTP

set -e

echo "🧪 Testing Download Endpoints"
echo "================================"

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Server not running on port 3000"
    echo "   Start server with: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test manifest.json
echo "📋 Testing manifest endpoint..."
if curl -s -f http://localhost:3000/downloads/manifest.json > /dev/null; then
    echo "✅ GET /downloads/manifest.json - OK"
    VERSION=$(curl -s http://localhost:3000/downloads/manifest.json | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   Version: $VERSION"
else
    echo "❌ GET /downloads/manifest.json - FAILED"
    exit 1
fi

echo ""

# Test chrome-extension.zip
echo "🔌 Testing chrome extension download..."
if curl -s -f -I http://localhost:3000/downloads/chrome-extension.zip | grep -q "200 OK"; then
    SIZE=$(curl -s -I http://localhost:3000/downloads/chrome-extension.zip | grep -i content-length | awk '{print $2}' | tr -d '\r')
    echo "✅ GET /downloads/chrome-extension.zip - OK"
    echo "   Size: $SIZE bytes"
else
    echo "❌ GET /downloads/chrome-extension.zip - FAILED"
    exit 1
fi

echo ""

# Test workflow-builder.zip
echo "⚙️  Testing workflow builder download..."
if curl -s -f -I http://localhost:3000/downloads/workflow-builder.zip | grep -q "200 OK"; then
    SIZE=$(curl -s -I http://localhost:3000/downloads/workflow-builder.zip | grep -i content-length | awk '{print $2}' | tr -d '\r')
    echo "✅ GET /downloads/workflow-builder.zip - OK"
    echo "   Size: $SIZE bytes"
else
    echo "❌ GET /downloads/workflow-builder.zip - FAILED"
    exit 1
fi

echo ""
echo "================================"
echo "✅ All download endpoints working!"
echo ""
echo "📦 Available Downloads:"
echo "   • Chrome Extension: http://localhost:3000/downloads/chrome-extension.zip"
echo "   • Workflow Builder: http://localhost:3000/downloads/workflow-builder.zip"
echo "   • Manifest:         http://localhost:3000/downloads/manifest.json"
echo ""
