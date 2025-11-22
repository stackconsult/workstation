/**
 * Database connection and initialization for Phase 1
 * Using SQLite for initial implementation with path to PostgreSQL
 */

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { readFileSync } from "fs";
import { join } from "path";
import { logger } from "../../utils/logger";

let db: Database | null = null;

/**
 * Initialize database connection and create tables
 */
export async function initializeDatabase(
  dbPath: string = "./workstation.db",
): Promise<Database> {
  if (db) {
    return db;
  }

  try {
    // Open SQLite database
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    logger.info("Database connection established", { dbPath });

    // Read and execute schema
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    await db.exec(schema);
    logger.info("Database schema initialized");

    return db;
  } catch (error) {
    logger.error("Failed to initialize database", { error });
    throw error;
  }
}

/**
 * Get current database instance
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info("Database connection closed");
  }
}

/**
 * Generate UUID v4 (simple implementation for SQLite)
 */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
