#!/bin/bash
# Test Git API endpoints

set -e

# Get JWT token
TOKEN=$(curl -s http://localhost:7042/auth/demo-token | jq -r '.token')

echo "=========================================="
echo "Git Operations API Test Results"
echo "=========================================="
echo ""

echo "1. Health Check:"
curl -s http://localhost:7042/health | jq -c '{status, version, database: .database.status}'
echo ""

echo "2. Git Status:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7042/api/v2/git/status | \
  jq -c '.data | {branch: .current, ahead, behind, clean: .isClean}'
echo ""

echo "3. List Branches (showing first 3):"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7042/api/v2/git/branches | \
  jq -c '.data[:3] | map({name, current})'
echo ""

echo "4. List Open Pull Requests:"
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:7042/api/v2/git/prs?state=open" | \
  jq -c '{success, pr_count: (.data | length)}'
echo ""

echo "=========================================="
echo "Service is running on http://localhost:7042"
echo "PID: $(cat logs/workstation-agent.pid 2>/dev/null || echo 'unknown')"
echo "=========================================="
