-- Phase 6 Security Enhancement: Token Encryption Migration
-- This migration should be run AFTER 001_add_workspaces.sql
-- It adds encrypted columns for sensitive data and migrates existing plaintext tokens

-- Add encrypted columns for OAuth tokens
ALTER TABLE oauth_accounts 
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;

-- Add encrypted columns for Slack tokens  
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS slack_access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS slack_bot_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS slack_webhook_url_encrypted TEXT;

-- Add hashed column for password reset tokens
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255) UNIQUE;

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash 
  ON password_reset_tokens(token_hash);

-- Notes for migration:
-- 1. Existing plaintext tokens in columns like slack_bot_token, access_token, refresh_token
--    should be encrypted using the token-encryption utility and stored in the new *_encrypted columns
-- 2. After migration and verification, the plaintext columns can be dropped in a future migration
-- 3. The application should use the encrypted columns going forward
-- 4. For password reset tokens, use hashToken() before storing and compare hashes on lookup

-- Migration strategy:
-- Phase 1: Add encrypted columns (this migration)
-- Phase 2: Application code updated to read/write encrypted columns (backward compatible)
-- Phase 3: Data migration script encrypts existing plaintext tokens
-- Phase 4: After verification, drop plaintext columns in future migration

-- Example application-side encryption:
-- const { encrypt } = require('../utils/token-encryption');
-- const encrypted = encrypt(plaintoken);
-- UPDATE oauth_accounts SET access_token_encrypted = $1 WHERE id = $2

-- Example application-side decryption:
-- const { decrypt } = require('../utils/token-encryption');
-- const plaintoken = decrypt(encryptedToken);

COMMENT ON COLUMN oauth_accounts.access_token_encrypted IS 'Encrypted OAuth access token (AES-256-GCM)';
COMMENT ON COLUMN oauth_accounts.refresh_token_encrypted IS 'Encrypted OAuth refresh token (AES-256-GCM)';
COMMENT ON COLUMN workspaces.slack_bot_token_encrypted IS 'Encrypted Slack bot token (AES-256-GCM)';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of reset token (compare using hash)';
