#!/bin/bash
# Test script for stackBrowserAgent

echo "=== stackBrowserAgent Test Suite ==="
echo ""

# Start the server
echo "Starting server..."
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test 1: Health check
echo "Test 1: Health check..."
HEALTH=$(curl -s http://localhost:3000/health | jq -r .status)
if [ "$HEALTH" = "ok" ]; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed"
    exit 1
fi

# Test 2: Get demo token
echo "Test 2: Demo token generation..."
DEMO_TOKEN=$(curl -s http://localhost:3000/auth/demo-token | jq -r .token)
if [ -n "$DEMO_TOKEN" ] && [ "$DEMO_TOKEN" != "null" ]; then
    echo "✓ Demo token generated"
else
    echo "✗ Demo token generation failed"
    kill $SERVER_PID
    exit 1
fi

# Test 3: Access protected route with token
echo "Test 3: Protected route with valid token..."
PROTECTED=$(curl -s -H "Authorization: Bearer $DEMO_TOKEN" http://localhost:3000/api/protected | jq -r .message)
if [[ "$PROTECTED" == *"Access granted"* ]]; then
    echo "✓ Protected route access successful"
else
    echo "✗ Protected route access failed"
    kill $SERVER_PID
    exit 1
fi

# Test 4: Access protected route without token
echo "Test 4: Protected route without token..."
NO_TOKEN=$(curl -s http://localhost:3000/api/protected | jq -r .error)
if [[ "$NO_TOKEN" == *"No token"* ]]; then
    echo "✓ Correctly rejected request without token"
else
    echo "✗ Should have rejected request without token"
    kill $SERVER_PID
    exit 1
fi

# Test 5: Access protected route with invalid token
echo "Test 5: Protected route with invalid token..."
INVALID=$(curl -s -H "Authorization: Bearer invalid-token" http://localhost:3000/api/protected | jq -r .error)
if [[ "$INVALID" == *"Invalid"* ]]; then
    echo "✓ Correctly rejected invalid token"
else
    echo "✗ Should have rejected invalid token"
    kill $SERVER_PID
    exit 1
fi

# Test 6: Custom token generation
echo "Test 6: Custom token generation..."
CUSTOM_TOKEN=$(curl -s -X POST http://localhost:3000/auth/token \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-user","role":"admin"}' | jq -r .token)
if [ -n "$CUSTOM_TOKEN" ] && [ "$CUSTOM_TOKEN" != "null" ]; then
    echo "✓ Custom token generated"
else
    echo "✗ Custom token generation failed"
    kill $SERVER_PID
    exit 1
fi

# Test 7: Agent status endpoint
echo "Test 7: Agent status with authentication..."
STATUS=$(curl -s -H "Authorization: Bearer $DEMO_TOKEN" http://localhost:3000/api/agent/status | jq -r .status)
if [ "$STATUS" = "running" ]; then
    echo "✓ Agent status check passed"
else
    echo "✗ Agent status check failed"
    kill $SERVER_PID
    exit 1
fi

# Cleanup
echo ""
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo ""
echo "=== All tests passed! ✓ ==="
echo ""
echo "Summary:"
echo "  - JWT authentication working correctly"
echo "  - Protected routes properly secured"
echo "  - Token generation and validation successful"
echo "  - All API endpoints functional"
