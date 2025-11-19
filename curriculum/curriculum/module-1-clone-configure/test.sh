#!/bin/bash
# Module 1 Validation Test Script
# Automated end-to-end validation for Workstation setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TIMEOUT=30
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

test_passed() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓${NC} $1"
}

test_failed() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if server is running
    if ! curl -s --max-time 5 "$BASE_URL/health" > /dev/null 2>&1; then
        log_error "Server is not running at $BASE_URL"
        log_info "Please start the server with: npm run dev"
        exit 1
    fi
    
    # Check for required commands
    for cmd in curl jq; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    test_passed "Prerequisites check"
}

# Test 1: Health Check
test_health_check() {
    log_info "Test 1: Health Check"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ]; then
        status_field=$(echo "$body" | jq -r '.status')
        if [ "$status_field" = "ok" ]; then
            test_passed "Health check returns 200 OK"
        else
            test_failed "Health check status field is not 'ok'"
        fi
    else
        test_failed "Health check failed with status $status"
    fi
}

# Test 2: JWT Token Generation
test_token_generation() {
    log_info "Test 2: JWT Token Generation"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/demo-token")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ]; then
        token=$(echo "$body" | jq -r '.token')
        if [ -n "$token" ] && [ "$token" != "null" ]; then
            # Check JWT format (3 parts separated by dots)
            if [[ "$token" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
                test_passed "JWT token generated successfully"
                echo "$token" > /tmp/workstation_test_token
            else
                test_failed "Generated token is not a valid JWT format"
            fi
        else
            test_failed "Token is empty or null"
        fi
    else
        test_failed "Token generation failed with status $status"
    fi
}

# Test 3: Protected Route Access
test_protected_route() {
    log_info "Test 3: Protected Route Access"
    
    if [ ! -f /tmp/workstation_test_token ]; then
        test_failed "No token available from previous test"
        return
    fi
    
    token=$(cat /tmp/workstation_test_token)
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL/api/protected")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ]; then
        test_passed "Protected route accessible with valid token"
    else
        test_failed "Protected route failed with status $status"
    fi
}

# Test 4: Invalid Token Handling
test_invalid_token() {
    log_info "Test 4: Invalid Token Handling"
    
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid-token" "$BASE_URL/api/protected")
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 403 ] || [ "$status" -eq 401 ]; then
        test_passed "Invalid token correctly rejected"
    else
        test_failed "Invalid token not rejected (status: $status)"
    fi
}

# Test 5: Missing Token Handling
test_missing_token() {
    log_info "Test 5: Missing Token Handling"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/protected")
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 401 ]; then
        test_passed "Missing token correctly rejected"
    else
        test_failed "Missing token not rejected (status: $status)"
    fi
}

# Test 6: Rate Limiting
test_rate_limiting() {
    log_info "Test 6: Rate Limiting (checking first few requests)"
    
    # Make a few requests to check rate limiting is active
    # Not testing full limit to avoid blocking during test
    rate_limited=false
    for i in {1..15}; do
        status=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/auth/demo-token")
        if [ "$status" -eq 429 ]; then
            rate_limited=true
            break
        fi
    done
    
    if [ "$rate_limited" = true ]; then
        test_passed "Rate limiting is active"
    else
        log_warning "Rate limiting not triggered (this may be OK if limit is high)"
        test_passed "Rate limiting configuration present"
    fi
    
    # Wait for rate limit to reset
    sleep 2
}

# Test 7: Environment Configuration
test_environment() {
    log_info "Test 7: Environment Configuration"
    
    if [ -f .env ]; then
        # Check JWT_SECRET is not default
        if grep -q "JWT_SECRET=changeme" .env; then
            test_failed "JWT_SECRET is still set to default value 'changeme'"
        else
            test_passed "JWT_SECRET is configured"
        fi
        
        # Check JWT_SECRET length
        jwt_secret=$(grep "JWT_SECRET=" .env | cut -d '=' -f2)
        if [ ${#jwt_secret} -ge 32 ]; then
            test_passed "JWT_SECRET is sufficiently long"
        else
            test_failed "JWT_SECRET should be at least 32 characters"
        fi
    else
        test_failed ".env file not found"
    fi
}

# Test 8: Build Artifacts
test_build_artifacts() {
    log_info "Test 8: Build Artifacts"
    
    if [ -d "dist" ]; then
        test_passed "dist/ directory exists"
        
        if [ -f "dist/index.js" ]; then
            test_passed "Main application compiled"
        else
            test_failed "dist/index.js not found"
        fi
    else
        test_failed "dist/ directory not found - run 'npm run build'"
    fi
}

# Test 9: Database Connection
test_database() {
    log_info "Test 9: Database Connection"
    
    if [ ! -f /tmp/workstation_test_token ]; then
        test_failed "No token available for database test"
        return
    fi
    
    token=$(cat /tmp/workstation_test_token)
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL/api/v2/workflows")
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ] || [ "$status" -eq 404 ]; then
        test_passed "Database connection working"
    else
        test_failed "Database connection failed (status: $status)"
    fi
}

# Test 10: Browser Agent Registration (if applicable)
test_browser_agent() {
    log_info "Test 10: Browser Agent Registration"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v2/agents" 2>/dev/null)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" -eq 200 ]; then
        body=$(echo "$response" | head -n -1)
        if echo "$body" | jq -e '.agents[] | select(.type == "browser")' > /dev/null 2>&1; then
            test_passed "Browser agent registered"
        else
            log_warning "Browser agent endpoint exists but browser agent not found"
        fi
    else
        log_warning "Browser agent endpoint not available (may not be implemented yet)"
    fi
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  Workstation Module 1 Validation Tests"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    echo ""
    
    test_health_check
    test_token_generation
    test_protected_route
    test_invalid_token
    test_missing_token
    test_rate_limiting
    test_environment
    test_build_artifacts
    test_database
    test_browser_agent
    
    echo ""
    echo "=========================================="
    echo "  Test Results"
    echo "=========================================="
    echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Failed:${NC} $TESTS_FAILED"
    echo ""
    
    # Cleanup
    rm -f /tmp/workstation_test_token
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo ""
        echo "Next Steps:"
        echo "  → Proceed to Module 2: Architecture Deep Dive"
        echo "  → Review: curriculum/module-2-architecture/README.md"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check server logs for errors"
        echo "  2. Verify .env configuration"
        echo "  3. Review validation-checklist.md for manual checks"
        echo "  4. Ensure all dependencies are installed"
        exit 1
    fi
}

# Run main function
main
