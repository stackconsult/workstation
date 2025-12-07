# Manual Testing Guide - PR #314 Implementation

## Overview

This guide provides step-by-step instructions for manually testing the three major features implemented in PR #314:

1. **Email Verification System**
2. **Duplicate Route Fix**
3. **Workspace Initialization**

## Prerequisites

### Environment Setup

1. **Clone and install:**
```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
git checkout copilot/sub-pr-314
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Database setup (PostgreSQL):**
```bash
# Create database
createdb workstation_saas

# Run migrations
psql -U postgres -d workstation_saas -f src/db/schema.sql
psql -U postgres -d workstation_saas -f src/db/migrations/002-add-email-verification.sql
```

4. **SMTP Configuration (Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@workstation.dev
APP_URL=http://localhost:7042
```

**Note:** Get Gmail App Password:
- Go to Google Account → Security → 2FA → App Passwords
- Generate password for "Mail"
- Use in `SMTP_PASS`

### Build and Start

```bash
# Build TypeScript
npm run build

# Start server
npm start

# Or development mode
npm run dev
```

## Test 1: Email Verification System

### Test 1.1: User Registration with Email Verification

**Objective:** Verify that users receive verification emails on registration

**Steps:**

1. **Register a new user:**
```bash
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User"
  }'
```

2. **Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@example.com",
      "fullName": "Test User",
      "accessLevel": "free",
      "licenseKey": "WS-XXXXXXXX-XXXX",
      "isVerified": false
    },
    "token": "jwt-token-here"
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

3. **Verify email sent:**
   - Check your email inbox for verification email
   - Subject: "Verify Your Email - Workstation"
   - Email should have HTML formatting with blue button
   - Plain text version should also be present

4. **Check database:**
```sql
-- User should exist and be unverified
SELECT email, is_verified FROM users WHERE email = 'testuser@example.com';
-- Result: is_verified = false

-- Verification token should exist
SELECT user_id, token, expires_at, used 
FROM email_verification_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com');
-- Result: One token, used = false, expires_at = NOW() + 24 hours
```

**Pass Criteria:**
- ✅ Registration returns HTTP 201
- ✅ `isVerified` is `false`
- ✅ Verification email received within 1 minute
- ✅ Email contains clickable verification link
- ✅ Database has verification token

### Test 1.2: Email Verification via Link

**Objective:** Verify that clicking the email link verifies the user

**Steps:**

1. **Extract verification link from email:**
   - Link format: `http://localhost:7042/api/auth/verify-email?token=xxx`
   - Copy the full URL

2. **Click the link or use curl:**
```bash
curl "http://localhost:7042/api/auth/verify-email?token=<token-from-email>"
```

3. **Expected result:**
   - Browser shows success page with green checkmark
   - Page says "Email Verified Successfully!"
   - "Go to Dashboard" button is visible

4. **Check database:**
```sql
-- User should now be verified
SELECT email, is_verified, email_verified_at 
FROM users 
WHERE email = 'testuser@example.com';
-- Result: is_verified = true, email_verified_at = NOW()

-- Token should be marked as used
SELECT used, used_at 
FROM email_verification_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com');
-- Result: used = true, used_at = NOW()
```

5. **Try using the same token again:**
```bash
curl "http://localhost:7042/api/auth/verify-email?token=<same-token>"
```

**Expected result:**
- Error page with message "Token has already been used or has expired"
- Red X icon
- Option to resend verification email

**Pass Criteria:**
- ✅ First verification succeeds
- ✅ User marked as verified in database
- ✅ Token marked as used
- ✅ Second attempt with same token fails gracefully
- ✅ Success/error pages render correctly

### Test 1.3: Resend Verification Email

**Objective:** Verify that users can request a new verification email

**Steps:**

1. **Register another user (for clean test):**
```bash
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser2@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User 2"
  }'
```

2. **Save the JWT token from response**

3. **Request resend verification email:**
```bash
curl -X POST http://localhost:7042/api/auth/resend-verification \
  -H "Authorization: Bearer <jwt-token-from-step-2>"
```

4. **Expected response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

5. **Check email inbox:**
   - New verification email should arrive
   - Should have different token than first email

6. **Check database:**
```sql
-- Should have TWO tokens for this user
SELECT COUNT(*) 
FROM email_verification_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser2@example.com');
-- Result: 2 tokens (original + resent)
```

**Pass Criteria:**
- ✅ Resend request returns HTTP 200
- ✅ New verification email received
- ✅ New token different from original
- ✅ Both tokens stored in database

### Test 1.4: Rate Limiting

**Objective:** Verify that resend is rate-limited to 5 per hour

**Steps:**

1. **Send 6 resend requests rapidly:**
```bash
# Save JWT token first
TOKEN="<jwt-token>"

# Send 6 requests
for i in {1..6}; do
  echo "Request $i"
  curl -X POST http://localhost:7042/api/auth/resend-verification \
    -H "Authorization: Bearer $TOKEN"
  echo ""
done
```

2. **Expected results:**
   - Requests 1-5: Success (HTTP 200)
   - Request 6: Rate limited (HTTP 400)

3. **Expected response for 6th request:**
```json
{
  "success": false,
  "error": "Too many verification emails sent. Please try again later."
}
```

**Pass Criteria:**
- ✅ First 5 requests succeed
- ✅ 6th request returns rate limit error
- ✅ Error message is clear and helpful

### Test 1.5: Verification After Verified

**Objective:** Verify proper handling when user is already verified

**Steps:**

1. **Verify a user (use Test 1.2 steps)**

2. **Try to resend verification for verified user:**
```bash
curl -X POST http://localhost:7042/api/auth/resend-verification \
  -H "Authorization: Bearer <jwt-token-of-verified-user>"
```

3. **Expected response:**
```json
{
  "success": false,
  "error": "Email is already verified"
}
```

**Pass Criteria:**
- ✅ Returns HTTP 400
- ✅ Error message indicates already verified
- ✅ No email sent

### Test 1.6: Token Expiration

**Objective:** Verify that tokens expire after 24 hours

**Steps:**

1. **Register a user and get verification token**

2. **Manually expire the token in database:**
```sql
UPDATE email_verification_tokens 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com');
```

3. **Try to verify with expired token:**
```bash
curl "http://localhost:7042/api/auth/verify-email?token=<expired-token>"
```

4. **Expected result:**
   - Error page with message "Invalid or expired verification token"
   - Red X icon
   - Option to resend verification email

**Pass Criteria:**
- ✅ Expired token rejected
- ✅ Clear error message
- ✅ User not verified

### Test 1.7: Development Mode (No SMTP)

**Objective:** Verify graceful degradation without SMTP

**Steps:**

1. **Remove SMTP credentials from .env:**
```env
# Comment out SMTP settings
# SMTP_USER=
# SMTP_PASS=
```

2. **Restart server:**
```bash
npm start
```

3. **Register a user:**
```bash
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "devtest@example.com",
    "password": "Test123!",
    "fullName": "Dev Test"
  }'
```

4. **Check server logs:**
```bash
tail -f logs/combined.log | grep -i "verification"
```

5. **Expected log entries:**
```
WARN: Email not sent - SMTP credentials not configured { email: 'devtest@example.com' }
INFO: Verification URL (dev mode) { verificationUrl: 'http://...' }
```

6. **Copy verification URL from logs and test:**
```bash
curl "<verification-url-from-logs>"
```

**Pass Criteria:**
- ✅ Registration succeeds without SMTP
- ✅ Warning logged about missing SMTP
- ✅ Verification URL logged to console
- ✅ Manual verification via logged URL works

## Test 2: Duplicate Route Fix

### Test 2.1: Verify No Duplicate Routes

**Objective:** Confirm duplicate workspace routes are removed

**Steps:**

1. **Start server with debug logging:**
```bash
LOG_LEVEL=debug npm start 2>&1 | grep "workspace"
```

2. **Expected output:**
```
Phase 6: Workspace management routes registered
```

**Note:** Should only see this message ONCE, not twice

3. **Check route registration:**
```bash
curl http://localhost:7042/api/workspaces
```

4. **Expected response:**
   - Valid JSON response (HTTP 200 or 401 if auth required)
   - NO duplicate response
   - NO "Route already registered" errors in logs

**Pass Criteria:**
- ✅ "Workspace management routes registered" logged once
- ✅ No errors about duplicate routes
- ✅ Workspace endpoint responds correctly

### Test 2.2: Check Slack Routes

**Objective:** Verify Slack routes not duplicated either

**Steps:**

1. **Check logs during startup:**
```bash
npm start 2>&1 | grep -i "slack"
```

2. **Expected output:**
```
Phase 6: Slack integration routes registered
```

**Note:** Should appear ONCE, not twice

**Pass Criteria:**
- ✅ Slack routes registered once
- ✅ No duplicate registration errors

## Test 3: Workspace Initialization

### Test 3.1: Automatic Initialization on Startup

**Objective:** Verify workspaces initialize automatically when server starts

**Steps:**

1. **Clear existing workspaces:**
```sql
DELETE FROM workspaces;
```

2. **Start server:**
```bash
npm start 2>&1 | grep -i "workspace"
```

3. **Expected log output:**
```
Phase 6: Workspaces table exists but empty, initializing...
Phase 6: Workspaces initialized successfully { stats: { total: 20, created: 20, skipped: 0, failed: 0 } }
```

4. **Check database:**
```sql
SELECT COUNT(*) FROM workspaces;
-- Result: 20

SELECT name, slug, type FROM workspaces ORDER BY name LIMIT 5;
-- Result: First 5 workspaces listed
```

**Pass Criteria:**
- ✅ Server starts successfully
- ✅ 20 workspaces created
- ✅ Workspaces have correct data
- ✅ No duplicate slugs

### Test 3.2: Idempotent Initialization

**Objective:** Verify re-running initialization doesn't create duplicates

**Steps:**

1. **Workspaces already exist (from Test 3.1)**

2. **Restart server:**
```bash
npm start 2>&1 | grep -i "workspace"
```

3. **Expected log output:**
```
Phase 6: Workspaces already initialized { count: 20, expected: 20 }
```

4. **Check database:**
```sql
SELECT COUNT(*) FROM workspaces;
-- Result: Still 20 (no duplicates)

-- Check for duplicate slugs
SELECT slug, COUNT(*) 
FROM workspaces 
GROUP BY slug 
HAVING COUNT(*) > 1;
-- Result: Empty (no duplicates)
```

**Pass Criteria:**
- ✅ Server starts successfully
- ✅ No new workspaces created
- ✅ Log indicates already initialized
- ✅ Still exactly 20 workspaces

### Test 3.3: Manual Initialization Script

**Objective:** Verify manual script works correctly

**Steps:**

1. **Clear workspaces:**
```sql
DELETE FROM workspaces;
```

2. **Run manual script:**
```bash
node dist/scripts/initialize-workspaces.js
```

3. **Expected output:**
```
============================================================
Workspace Initialization Script
============================================================

Checking current workspace status...

Current Status:
  Database Available: ✓
  Workspaces Table: ✓
  Existing Workspaces: 0 / 20

Starting workspace initialization...

============================================================
Initialization Results:
============================================================
  Status: ✓ SUCCESS
  Message: Initialized 20 workspaces (0 already existed, 0 failed)

Statistics:
  Total Workspaces: 20
  Created: 20
  Already Existed: 0
  Failed: 0
============================================================

✓ Workspace initialization completed successfully
```

4. **Check database:**
```sql
SELECT COUNT(*) FROM workspaces;
-- Result: 20
```

**Pass Criteria:**
- ✅ Script executes successfully
- ✅ Clear, formatted output
- ✅ 20 workspaces created
- ✅ Exit code 0

### Test 3.4: Graceful Degradation (No Database)

**Objective:** Verify server handles database unavailability gracefully

**Steps:**

1. **Stop PostgreSQL:**
```bash
# On Linux
sudo systemctl stop postgresql

# On Mac
brew services stop postgresql

# Or just change DB_HOST in .env to invalid host
```

2. **Start server:**
```bash
npm start 2>&1 | grep -i "workspace"
```

3. **Expected log output:**
```
Phase 6: Database not available, skipping workspace initialization
```

4. **Verify server continues running:**
```bash
curl http://localhost:7042/health
```

**Expected:** Server responds (HTTP 200)

**Pass Criteria:**
- ✅ Server starts despite database failure
- ✅ Warning logged about database
- ✅ Workspace init skipped gracefully
- ✅ Other endpoints still work

### Test 3.5: Partial Initialization

**Objective:** Verify handling of partial workspace initialization

**Steps:**

1. **Create only 10 workspaces manually:**
```sql
INSERT INTO workspaces (name, slug, type, description) VALUES
('Web Automation', 'web-automation', 'automation', 'Browser automation'),
('Data Processing', 'data-processing', 'data', 'ETL pipelines'),
('API Integration', 'api-integration', 'integration', 'REST API'),
('Email Automation', 'email-automation', 'automation', 'Email workflows'),
('Social Media', 'social-media', 'integration', 'Social media'),
('File Management', 'file-management', 'data', 'File processing'),
('Database Operations', 'database-ops', 'data', 'Database queries'),
('CI/CD Pipeline', 'cicd-pipeline', 'development', 'CI/CD'),
('Monitoring & Alerts', 'monitoring-alerts', 'monitoring', 'Monitoring'),
('Slack Integration', 'slack-integration', 'integration', 'Slack bot');
```

2. **Start server:**
```bash
npm start 2>&1 | grep -i "workspace"
```

3. **Expected log output:**
```
Phase 6: Workspaces initialized successfully { stats: { total: 20, created: 10, skipped: 10, failed: 0 } }
```

4. **Check database:**
```sql
SELECT COUNT(*) FROM workspaces;
-- Result: 20 (10 original + 10 new)
```

**Pass Criteria:**
- ✅ Missing workspaces created
- ✅ Existing workspaces skipped
- ✅ Total count is 20
- ✅ Statistics logged correctly

## Test 4: Integration Tests

### Test 4.1: Full User Journey

**Objective:** Test complete user flow from registration to verification

**Steps:**

1. **Register:**
```bash
curl -X POST http://localhost:7042/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "journey@example.com",
    "password": "Test123!",
    "fullName": "Journey Test"
  }'
```

2. **Save JWT token from response**

3. **Try accessing protected endpoint (should work even if unverified):**
```bash
curl -X GET http://localhost:7042/api/workspaces \
  -H "Authorization: Bearer <jwt-token>"
```

4. **Verify email via link from inbox**

5. **Check verification status:**
```sql
SELECT email, is_verified, email_verified_at 
FROM users 
WHERE email = 'journey@example.com';
```

6. **Try resending (should fail - already verified):**
```bash
curl -X POST http://localhost:7042/api/auth/resend-verification \
  -H "Authorization: Bearer <jwt-token>"
```

**Pass Criteria:**
- ✅ All steps complete successfully
- ✅ User can access endpoints before verification
- ✅ Verification succeeds
- ✅ Resend fails after verification

### Test 4.2: Load Test (Email Verification)

**Objective:** Verify system handles multiple concurrent registrations

**Steps:**

1. **Run concurrent registrations:**
```bash
#!/bin/bash
for i in {1..10}; do
  (
    curl -X POST http://localhost:7042/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"load$i@example.com\",
        \"password\": \"Test123!\",
        \"fullName\": \"Load Test $i\"
      }"
  ) &
done
wait
```

2. **Check results:**
```sql
SELECT COUNT(*) FROM users WHERE email LIKE 'load%@example.com';
-- Result: 10 users

SELECT COUNT(*) FROM email_verification_tokens WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'load%@example.com'
);
-- Result: 10 tokens
```

**Pass Criteria:**
- ✅ All 10 users created
- ✅ All 10 tokens created
- ✅ No database errors
- ✅ Reasonable response time (<2s per request)

## Test Results Summary

### Expected Results

After completing all tests, you should have:

**Email Verification:**
- ✅ Registration sends verification email
- ✅ Email verification works correctly
- ✅ Resend verification works
- ✅ Rate limiting enforced (5 per hour)
- ✅ Already verified users handled correctly
- ✅ Expired tokens rejected
- ✅ Development mode works without SMTP

**Duplicate Routes:**
- ✅ Workspace routes registered once
- ✅ Slack routes registered once
- ✅ No duplicate registration errors

**Workspace Initialization:**
- ✅ Automatic initialization on startup
- ✅ Idempotent (safe to re-run)
- ✅ Manual script works
- ✅ Graceful degradation without database
- ✅ Partial initialization handled

## Troubleshooting

### Issue: Emails not being sent

**Check:**
- SMTP credentials in .env
- Gmail app password (not regular password)
- Firewall allows port 587
- Check logs: `tail -f logs/error.log`

### Issue: Database connection failed

**Check:**
- PostgreSQL is running
- Database credentials in .env
- Database exists: `psql -l | grep workstation`
- User has permissions

### Issue: Build failed

**Check:**
- Node.js version: `node --version` (should be 18+)
- Dependencies installed: `npm install`
- TypeScript version: `npx tsc --version`

---

**Last Updated:** 2025-12-07  
**Test Coverage:** Email Verification, Duplicate Routes, Workspace Init  
**Status:** Ready for QA
