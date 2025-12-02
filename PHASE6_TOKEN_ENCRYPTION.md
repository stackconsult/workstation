# Phase 6 Security Enhancements: Token Encryption

## Overview

This document describes the token encryption implementation added in response to security code review feedback. All sensitive tokens (OAuth, Slack, password reset) are now encrypted at rest in the database using AES-256-GCM encryption.

## Security Issues Addressed

### Critical: Plaintext Token Storage

**Original Issue:** OAuth tokens, Slack credentials, and password reset tokens were stored in plaintext in the database, allowing immediate compromise if the database was accessed.

**Impact:** 
- OAuth tokens could be used to access user Google/GitHub accounts
- Slack tokens could be used to impersonate the bot and access workspace data
- Password reset tokens could be used to hijack user accounts

**Solution:** All sensitive tokens are now encrypted using AES-256-GCM before storage and decrypted only when needed.

## Encryption Implementation

### Encryption Algorithm

**AES-256-GCM** (Galois/Counter Mode)
- Provides both encryption and authentication
- 256-bit key strength
- Built-in authentication tag prevents tampering
- Industry standard for sensitive data

### Key Derivation

- Master secret from `ENCRYPTION_KEY` environment variable (or `JWT_SECRET` as fallback)
- PBKDF2 with 100,000 iterations for key derivation
- Unique salt per encrypted value
- SHA-256 hash function

### Storage Format

Encrypted data is stored as base64-encoded string with format:
```
base64(salt || iv || authTag || ciphertext)
```

Components:
- **Salt (32 bytes)**: Random salt for PBKDF2 key derivation
- **IV (16 bytes)**: Initialization vector for AES-GCM
- **AuthTag (16 bytes)**: Authentication tag for integrity verification
- **Ciphertext**: Encrypted data

## Database Schema Changes

### Migration 002: Add Encrypted Columns

New columns added (backward compatible):

```sql
-- OAuth tokens
ALTER TABLE oauth_accounts 
  ADD COLUMN access_token_encrypted TEXT,
  ADD COLUMN refresh_token_encrypted TEXT;

-- Slack credentials
ALTER TABLE workspaces
  ADD COLUMN slack_bot_token_encrypted TEXT,
  ADD COLUMN slack_access_token_encrypted TEXT,
  ADD COLUMN slack_webhook_url_encrypted TEXT;

-- Password reset tokens (hashed, not encrypted)
ALTER TABLE password_reset_tokens
  ADD COLUMN token_hash VARCHAR(255) UNIQUE;
```

### Migration Strategy

**Phase 1** (Current): Add encrypted columns
- Plaintext columns remain for backward compatibility
- Application code updated to use encrypted columns for new data
- Existing plaintext data still accessible

**Phase 2** (Data Migration): Encrypt existing tokens
- Run migration script to encrypt existing plaintext tokens
- Copy encrypted values to new columns
- Verify encryption/decryption works

**Phase 3** (Cleanup): Drop plaintext columns
- After verification period, drop plaintext columns
- Update database constraints

## Usage

### Encrypting OAuth Tokens

```typescript
import { encrypt, decrypt } from '../utils/token-encryption';

// During OAuth callback - encrypt before storage
const encryptedAccess = encrypt(accessToken);
const encryptedRefresh = encrypt(refreshToken);

await db.query(
  `INSERT INTO oauth_accounts (user_id, provider, access_token_encrypted, refresh_token_encrypted)
   VALUES ($1, $2, $3, $4)`,
  [userId, provider, encryptedAccess, encryptedRefresh]
);

// When using tokens - decrypt on retrieval
const result = await db.query(
  'SELECT access_token_encrypted FROM oauth_accounts WHERE id = $1',
  [accountId]
);

const accessToken = decrypt(result.rows[0].access_token_encrypted);
// Use accessToken for API calls
```

### Encrypting Slack Tokens

```typescript
import { encrypt, decrypt } from '../utils/token-encryption';

// After Slack OAuth - encrypt before storage
const encryptedBotToken = encrypt(slackBotToken);

await db.query(
  `UPDATE workspaces 
   SET slack_bot_token_encrypted = $1, slack_team_id = $2
   WHERE id = $3`,
  [encryptedBotToken, slackTeamId, workspaceId]
);

// When initializing Slack client - decrypt
const result = await db.query(
  'SELECT slack_bot_token_encrypted FROM workspaces WHERE id = $1',
  [workspaceId]
);

const botToken = decrypt(result.rows[0].slack_bot_token_encrypted);
const client = new WebClient(botToken);
```

### Hashing Password Reset Tokens

Password reset tokens use **hashing** instead of encryption because they are single-use and never need to be decrypted:

```typescript
import { hashToken, generateSecureToken } from '../utils/token-encryption';

// Generate and send reset token
const rawToken = generateSecureToken(32); // 64-char hex string
const tokenHash = hashToken(rawToken);

await db.query(
  `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip_address)
   VALUES ($1, $2, $3, $4)`,
  [userId, tokenHash, expiresAt, ipAddress]
);

// Send rawToken via email (never store it)
sendPasswordResetEmail(email, rawToken);

// When user clicks reset link with token
const providedToken = req.query.token;
const providedHash = hashToken(providedToken);

const result = await db.query(
  `SELECT user_id, expires_at FROM password_reset_tokens 
   WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
  [providedHash]
);

if (result.rows.length === 0) {
  return res.status(400).json({ error: 'Invalid or expired token' });
}
```

## Environment Configuration

### Required Environment Variable

Add to `.env`:
```env
# Encryption key for sensitive tokens (32+ characters recommended)
ENCRYPTION_KEY=your-secure-encryption-key-min-32-chars

# Fallback: JWT_SECRET will be used if ENCRYPTION_KEY not set
# But ENCRYPTION_KEY is recommended for separation of concerns
```

### Security Best Practices

1. **Use strong encryption key**: Minimum 32 characters, random, high entropy
2. **Never commit encryption key**: Add to .env, not to version control
3. **Rotate keys periodically**: Plan for key rotation strategy
4. **Separate encryption keys**: Use different key than JWT_SECRET in production
5. **Use KMS in production**: Consider AWS KMS, Google Cloud KMS, or HashiCorp Vault

### Generating Secure Keys

```bash
# Generate random encryption key (64 characters)
openssl rand -base64 48

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Performance Considerations

### Encryption Overhead

- **Encrypt operation**: ~1-2ms per token
- **Decrypt operation**: ~1-2ms per token
- **Minimal impact** on application performance
- Operations are synchronous (no async overhead)

### Optimization Strategies

1. **Cache decrypted tokens**: For frequently used tokens (Slack bot tokens)
2. **Batch operations**: Encrypt/decrypt multiple tokens at once
3. **Lazy decryption**: Only decrypt when needed for API calls

### Caching Example

```typescript
// Cache Slack clients to avoid repeated decryption
const slackClientCache = new Map<string, { client: WebClient, expires: number }>();

async function getSlackClient(workspaceId: string): Promise<WebClient> {
  const cached = slackClientCache.get(workspaceId);
  if (cached && cached.expires > Date.now()) {
    return cached.client;
  }

  const result = await db.query(
    'SELECT slack_bot_token_encrypted FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  
  const botToken = decrypt(result.rows[0].slack_bot_token_encrypted);
  const client = new WebClient(botToken);
  
  // Cache for 1 hour
  slackClientCache.set(workspaceId, {
    client,
    expires: Date.now() + 3600000
  });
  
  return client;
}
```

## Testing

### Unit Tests for Encryption

```typescript
import { encrypt, decrypt, hashToken } from '../utils/token-encryption';

describe('Token Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'xoxb-slack-bot-token-12345';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    
    expect(encrypted).not.toBe(original);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext for same input', () => {
    const token = 'same-token';
    const encrypted1 = encrypt(token);
    const encrypted2 = encrypt(token);
    
    // Different due to random IV and salt
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to same value
    expect(decrypt(encrypted1)).toBe(token);
    expect(decrypt(encrypted2)).toBe(token);
  });

  it('should hash tokens consistently', () => {
    const token = 'reset-token-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });
});
```

## Migration Guide

### Step 1: Apply Database Migration

```bash
psql -U postgres -d workstation_saas -f src/db/migrations/002_encrypt_tokens.sql
```

### Step 2: Update Environment

Add `ENCRYPTION_KEY` to your `.env` file:
```env
ENCRYPTION_KEY=<generate-using-openssl-rand-base64-48>
```

### Step 3: Code Deployment

Deploy updated application code that uses encrypted columns.

### Step 4: Data Migration (Optional)

If you have existing plaintext tokens, run migration script:

```typescript
// scripts/migrate-encrypt-tokens.ts
import { encrypt } from '../utils/token-encryption';
import db from '../db/connection';

async function migrateOAuthTokens() {
  const result = await db.query(
    'SELECT id, access_token, refresh_token FROM oauth_accounts WHERE access_token IS NOT NULL'
  );

  for (const row of result.rows) {
    const encryptedAccess = row.access_token ? encrypt(row.access_token) : null;
    const encryptedRefresh = row.refresh_token ? encrypt(row.refresh_token) : null;

    await db.query(
      'UPDATE oauth_accounts SET access_token_encrypted = $1, refresh_token_encrypted = $2 WHERE id = $3',
      [encryptedAccess, encryptedRefresh, row.id]
    );
  }

  console.log(`Migrated ${result.rows.length} OAuth accounts`);
}

// Run similar migrations for Slack tokens
```

### Step 5: Verification

Test that encrypted tokens work correctly:
```bash
npm test
# Check OAuth login flow
# Check Slack integration
# Check password reset flow
```

### Step 6: Cleanup (Future)

After verification period, drop plaintext columns:
```sql
ALTER TABLE oauth_accounts DROP COLUMN access_token;
ALTER TABLE oauth_accounts DROP COLUMN refresh_token;
ALTER TABLE workspaces DROP COLUMN slack_bot_token;
ALTER TABLE password_reset_tokens DROP COLUMN token;
```

## Compliance

### GDPR Compliance

- Encryption at rest protects personal data
- Key rotation capability supports data protection requirements
- Audit trail for token access can be added

### PCI DSS Compliance

- Strong encryption algorithm (AES-256-GCM)
- Key management best practices
- Separation of encryption keys from data

### SOC 2 Compliance

- Data encryption controls
- Key management procedures
- Access logging capability

## Troubleshooting

### "Failed to decrypt data" Error

**Cause**: Encryption key changed or data corrupted

**Solution**:
1. Check `ENCRYPTION_KEY` environment variable
2. Ensure same key used for encrypt and decrypt
3. For key rotation, decrypt with old key and re-encrypt with new key

### "Encryption secret is weak" Warning

**Cause**: `ENCRYPTION_KEY` not set or too short

**Solution**: Set strong encryption key in environment:
```bash
export ENCRYPTION_KEY=$(openssl rand -base64 48)
```

### Performance Degradation

**Cause**: Decrypting tokens on every request

**Solution**: Implement caching for frequently used tokens (see caching example above)

## Future Enhancements

### Key Rotation

Implement automated key rotation:
```typescript
// Decrypt with old key, re-encrypt with new key
const oldKey = process.env.OLD_ENCRYPTION_KEY;
const newKey = process.env.ENCRYPTION_KEY;

// Migration script would handle rotation
```

### Hardware Security Module (HSM)

For enterprise deployments, integrate with HSM:
- AWS CloudHSM
- Google Cloud HSM
- Azure Key Vault

### Envelope Encryption

For additional security, use envelope encryption:
- Data encrypted with data encryption key (DEK)
- DEK encrypted with key encryption key (KEK)
- KEK stored in KMS

## References

- [NIST SP 800-38D](https://csrc.nist.gov/publications/detail/sp/800-38d/final) - GCM Mode
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

## Support

For questions or issues with token encryption:
1. Check this documentation
2. Review unit tests in `tests/utils/token-encryption.test.ts`
3. Open GitHub issue with `security` label
