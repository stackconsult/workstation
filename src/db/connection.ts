/**
 * Database Connection Module
 * PostgreSQL connection pool for SaaS platform with retry logic
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "workstation_saas",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2s to 5s
};

// Create connection pool
const pool = new Pool(dbConfig);

// Database connection state
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

// Handle pool errors - don't exit immediately, log and mark as disconnected
pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", { error: err });
  isConnected = false;
  // Don't exit - allow graceful degradation
});

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test database connection with retry logic
 */
async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()");
    logger.info("Database connected successfully", {
      timestamp: result.rows[0].now,
      retries: connectionRetries,
    });
    isConnected = true;
    connectionRetries = 0;
    return true;
  } catch (err) {
    logger.error("Database connection failed", {
      error: err instanceof Error ? err.message : String(err),
      attempt: connectionRetries + 1,
      maxRetries: MAX_RETRIES,
    });
    return false;
  }
}

/**
 * Initialize database connection with retry logic
 */
async function initializeConnection(): Promise<void> {
  while (connectionRetries < MAX_RETRIES) {
    const connected = await testConnection();

    if (connected) {
      return;
    }

    connectionRetries++;

    if (connectionRetries < MAX_RETRIES) {
      logger.info(`Retrying database connection in ${RETRY_DELAY}ms...`, {
        attempt: connectionRetries,
        maxRetries: MAX_RETRIES,
      });
      await sleep(RETRY_DELAY);
    }
  }

  // After max retries, log warning but don't exit - allow graceful degradation
  logger.warn(
    "Database connection failed after max retries - operating in degraded mode",
    {
      maxRetries: MAX_RETRIES,
      message: "Some features may be unavailable",
    },
  );
  isConnected = false;
}

// Initialize connection on startup (async, non-blocking)
initializeConnection().catch((err) => {
  logger.error("Fatal database initialization error", { error: err });
});

/**
 * Execute a query with error handling
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> {
  const start = Date.now();

  if (!isConnected) {
    logger.warn(
      "Query attempted while database disconnected, attempting reconnection...",
    );
    await initializeConnection();

    if (!isConnected) {
      throw new Error("Database is not connected - operation unavailable");
    }
  }

  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error("Query error", { text, error });
    isConnected = false; // Mark as disconnected on query error
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  if (!isConnected) {
    await initializeConnection();

    if (!isConnected) {
      throw new Error("Database is not connected - operation unavailable");
    }
  }

  const client = await pool.connect();
  return client;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * Close all connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
  isConnected = false;
  logger.info("Database pool closed");
}

// Export pool for direct access if needed
export const db = {
  query,
  getClient,
  transaction,
  closePool,
  isDatabaseConnected,
  pool,
};

export default db;
