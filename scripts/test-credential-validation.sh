#!/bin/bash

# Test script for credential validation action
# Tests all three states: valid, filler, and missing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION_DIR="$SCRIPT_DIR/../.github/actions/validate-credentials"
ACTION_FILE="$ACTION_DIR/action.yml"

echo "🧪 Testing Credential Validation Action"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to simulate the validation logic
test_validation() {
    local test_name="$1"
    local cred_value="$2"
    local expected_status="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo "Test $TESTS_RUN: $test_name"
    echo "  Input: '$cred_value'"
    echo "  Expected: $expected_status"
    
    # Simulate the validation logic
    local actual_status=""
    
    # Check if empty/null/missing
    if [ -z "$cred_value" ] || [ "$cred_value" = "null" ]; then
        actual_status="missing"
    else
        # Check filler patterns
        local is_filler=false
        for pattern in "PLACEHOLDER" "YOUR_" "FILLER" "EXAMPLE" "TODO" "CHANGEME" "xxx" "yyy" "zzz"; do
            if echo "$cred_value" | grep -qi "$pattern"; then
                is_filler=true
                break
            fi
        done
        
        if [ "$is_filler" = "true" ]; then
            actual_status="filler"
        else
            actual_status="valid"
        fi
    fi
    
    # Compare results
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "  Result: ${GREEN}✓ PASS${NC} (got $actual_status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo ""
        return 0
    else
        echo -e "  Result: ${RED}✗ FAIL${NC} (expected $expected_status, got $actual_status)"
        echo ""
        return 1
    fi
}

echo "Testing MISSING state..."
echo "------------------------"
test_validation "Empty string" "" "missing"
test_validation "Null value" "null" "missing"

echo "Testing FILLER state..."
echo "----------------------"
test_validation "PLACEHOLDER pattern" "PLACEHOLDER_VALUE" "filler"
test_validation "YOUR_ pattern" "YOUR_API_KEY_HERE" "filler"
test_validation "FILLER pattern" "FILLER_CREDENTIALS" "filler"
test_validation "EXAMPLE pattern" "example@example.com" "filler"
test_validation "TODO pattern" "TODO_REPLACE_THIS" "filler"
test_validation "CHANGEME pattern" "CHANGEME_BEFORE_DEPLOY" "filler"
test_validation "xxx pattern" "xxx-xxx-xxx" "filler"
test_validation "Mixed case PLACEHOLDER" "placeholder-key-here" "filler"

echo "Testing VALID state..."
echo "---------------------"
test_validation "URL with your-app (needs custom pattern)" "https://your-app.railway.app" "valid"
test_validation "Gitleaks string (needs custom pattern)" "gitleaks-license-here" "valid"
test_validation "Real API key format" "sk-proj-1234567890abcdefghijklmnop" "valid"
test_validation "Real URL" "https://my-actual-app-2024.railway.app" "valid"
test_validation "UUID format" "550e8400-e29b-41d4-a716-446655440000" "valid"
test_validation "Base64 token" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" "valid"
test_validation "GitHub token format" "ghp_1234567890abcdefghijklmnopqrstuvwxyz" "valid"
test_validation "Railway URL real" "https://creditx-workstation-prod.up.railway.app" "valid"

echo ""
echo "========================================"
echo "Test Results:"
echo -e "${GREEN}$TESTS_PASSED${NC} of $TESTS_RUN tests passed"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
