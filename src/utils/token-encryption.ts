/**
 * Token Encryption Utility
 * Provides encryption/decryption for sensitive tokens stored in database
 * Uses AES-256-GCM for strong encryption with authentication
 */

import crypto from "crypto";
import { logger } from "./logger";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derives encryption key from secret using PBKDF2
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");
}

/**
 * Get encryption secret from environment
 * Falls back to JWT_SECRET if ENCRYPTION_KEY not set
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    logger.warn(
      "Encryption secret is weak or missing. Using default (INSECURE in production)",
    );
    return "dev-encryption-key-change-in-production-min-32-chars";
  }
  return secret;
}

/**
 * Encrypts a string value using AES-256-GCM
 * Returns base64-encoded encrypted data with format: salt:iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return "";
  }

  try {
    const secret = getEncryptionSecret();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(secret, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, "base64"),
    ]);

    return combined.toString("base64");
  } catch (error) {
    logger.error("Encryption failed", { error });
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts a string value encrypted with encrypt()
 * Expects base64-encoded data with format: salt:iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return "";
  }

  try {
    const secret = getEncryptionSecret();
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const ciphertext = combined.subarray(
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );

    const key = deriveKey(secret, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(
      ciphertext.toString("base64"),
      "base64",
      "utf8",
    );
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption failed", { error });
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hashes a token using SHA-256 for secure storage
 * Use this for password reset tokens and similar use-once tokens
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Encrypts an object by encrypting all string values
 * Useful for encrypting OAuth profiles or complex data structures
 */
export function encryptObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const encrypted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 0) {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

/**
 * Decrypts an object encrypted with encryptObject()
 */
export function decryptObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const decrypted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 0) {
      try {
        decrypted[key] = decrypt(value);
      } catch {
        // If decryption fails, value might not be encrypted
        decrypted[key] = value;
      }
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}
