-- Email Verification Tables Migration
-- Add email verification token storage and tracking
-- Version: 1.0.0
-- Date: 2025-12-07

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- Add is_verified column to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add email_verified_at column to track when email was verified
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user 
  ON email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
  ON email_verification_tokens(token);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires 
  ON email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_used 
  ON email_verification_tokens(used, expires_at);

CREATE INDEX IF NOT EXISTS idx_users_verified 
  ON users(is_verified);

-- Trigger to update email_verified_at when is_verified is set to true
CREATE OR REPLACE FUNCTION update_email_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = true AND OLD.is_verified = false THEN
    NEW.email_verified_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_verified_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.is_verified IS DISTINCT FROM NEW.is_verified)
  EXECUTE FUNCTION update_email_verified_at();

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and columns for documentation
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens with expiration and usage tracking';
COMMENT ON COLUMN email_verification_tokens.token IS 'JWT token for email verification (24h expiration)';
COMMENT ON COLUMN email_verification_tokens.used IS 'Whether token has been used for verification';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN users.is_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';

-- Grant permissions (adjust based on your database roles)
-- GRANT SELECT, INSERT, UPDATE ON email_verification_tokens TO workstation_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO workstation_app;
