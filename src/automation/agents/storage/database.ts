/**
 * Database Agent for workflow automation
 * Handles PostgreSQL and SQLite database operations
 * Phase 10: Storage Agents
 */

import { Pool, PoolClient } from "pg";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { logger } from "../../../utils/logger";
import { db as pgConnection } from "../../../db/connection";

export interface DatabaseConfig {
  type: "postgresql" | "sqlite";
  // PostgreSQL config (uses existing connection from src/db/connection.ts)
  useExistingConnection?: boolean;
  connectionString?: string;
  // SQLite config
  filename?: string;
}

export interface QueryParams {
  query: string;
  params?: unknown[];
}

export interface InsertParams {
  table: string;
  data: Record<string, unknown> | Record<string, unknown>[];
  returning?: string[];
}

export interface UpdateParams {
  table: string;
  data: Record<string, unknown>;
  where: Record<string, unknown>;
  returning?: string[];
}

export interface DeleteParams {
  table: string;
  where: Record<string, unknown>;
  returning?: string[];
}

export interface TransactionParams {
  operations: Array<{
    type: "query" | "insert" | "update" | "delete";
    params: QueryParams | InsertParams | UpdateParams | DeleteParams;
  }>;
}

export interface TableInfo {
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default: unknown;
    primaryKey: boolean;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    unique: boolean;
  }>;
}

/**
 * Database Agent Implementation
 * Provides comprehensive database operations for PostgreSQL and SQLite
 */
export class DatabaseAgent {
  private pgPool: Pool | null = null;
  private sqliteDb: Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    logger.info("Connecting to database", { type: this.config.type });

    try {
      if (this.config.type === "postgresql") {
        if (this.config.useExistingConnection) {
          // Use existing connection from src/db/connection.ts
          this.pgPool = pgConnection.pool;
          logger.info("Using existing PostgreSQL connection pool");
        } else if (this.config.connectionString) {
          // Create new connection pool
          this.pgPool = new Pool({
            connectionString: this.config.connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          });

          // Test connection
          await this.pgPool.query("SELECT NOW()");
          logger.info("PostgreSQL connection established");
        } else {
          throw new Error(
            "PostgreSQL requires either useExistingConnection or connectionString",
          );
        }
      } else if (this.config.type === "sqlite") {
        if (!this.config.filename) {
          throw new Error("SQLite requires filename in config");
        }

        this.sqliteDb = await open({
          filename: this.config.filename,
          driver: sqlite3.Database,
        });

        logger.info("SQLite connection established", {
          filename: this.config.filename,
        });
      } else {
        throw new Error(`Unsupported database type: ${this.config.type}`);
      }
    } catch (error) {
      logger.error("Database connection failed", {
        error,
        type: this.config.type,
      });
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    logger.info("Disconnecting from database", { type: this.config.type });

    try {
      if (
        this.config.type === "postgresql" &&
        this.pgPool &&
        !this.config.useExistingConnection
      ) {
        await this.pgPool.end();
        this.pgPool = null;
        logger.info("PostgreSQL connection closed");
      } else if (this.config.type === "sqlite" && this.sqliteDb) {
        await this.sqliteDb.close();
        this.sqliteDb = null;
        logger.info("SQLite connection closed");
      }
    } catch (error) {
      logger.error("Database disconnect failed", { error });
      throw error;
    }
  }

  /**
   * Execute SQL query with parameters
   */
  async query(params: QueryParams): Promise<{
    rows: unknown[];
    rowCount: number;
    fields?: unknown[];
  }> {
    logger.info("Executing query", {
      type: this.config.type,
      query: params.query.substring(0, 100),
    });

    try {
      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        const result = await this.pgPool.query(
          params.query,
          params.params as unknown[],
        );
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          fields: result.fields,
        };
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        const rows = await this.sqliteDb.all(params.query, params.params);
        return {
          rows: rows || [],
          rowCount: rows?.length || 0,
        };
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Query execution failed", { error, query: params.query });
      throw error;
    }
  }

  /**
   * Insert records (single or batch)
   */
  async insert(params: InsertParams): Promise<{
    success: boolean;
    insertedCount: number;
    insertedIds?: unknown[];
    returning?: unknown[];
  }> {
    logger.info("Inserting records", {
      table: params.table,
      count: Array.isArray(params.data) ? params.data.length : 1,
    });

    try {
      const records = Array.isArray(params.data) ? params.data : [params.data];

      if (records.length === 0) {
        return { success: true, insertedCount: 0 };
      }

      const columns = Object.keys(records[0]);
      const insertedIds: unknown[] = [];

      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        // Build parameterized query for batch insert
        const placeholders = records
          .map((_, idx) => {
            const start = idx * columns.length;
            return `(${columns.map((_, colIdx) => `$${start + colIdx + 1}`).join(", ")})`;
          })
          .join(", ");

        const values = records.flatMap((record) =>
          columns.map((col) => record[col]),
        );

        const returningClause = params.returning
          ? ` RETURNING ${params.returning.join(", ")}`
          : "";
        const query = `INSERT INTO ${params.table} (${columns.join(", ")}) VALUES ${placeholders}${returningClause}`;

        const result = await this.pgPool.query(query, values);

        return {
          success: true,
          insertedCount: result.rowCount || 0,
          returning: result.rows.length > 0 ? result.rows : undefined,
        };
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        // SQLite doesn't support batch insert with RETURNING, so we insert one by one
        for (const record of records) {
          const placeholders = columns.map(() => "?").join(", ");
          const values = columns.map((col) => record[col]);

          const query = `INSERT INTO ${params.table} (${columns.join(", ")}) VALUES (${placeholders})`;
          const result = await this.sqliteDb.run(query, values);

          if (result.lastID) {
            insertedIds.push(result.lastID);
          }
        }

        return {
          success: true,
          insertedCount: records.length,
          insertedIds,
        };
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Insert operation failed", { error, table: params.table });
      throw error;
    }
  }

  /**
   * Update records
   */
  async update(params: UpdateParams): Promise<{
    success: boolean;
    updatedCount: number;
    returning?: unknown[];
  }> {
    logger.info("Updating records", { table: params.table });

    try {
      const setColumns = Object.keys(params.data);
      const whereColumns = Object.keys(params.where);

      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        const setClause = setColumns
          .map((col, idx) => `${col} = $${idx + 1}`)
          .join(", ");
        const whereClause = whereColumns
          .map((col, idx) => `${col} = $${idx + setColumns.length + 1}`)
          .join(" AND ");
        const returningClause = params.returning
          ? ` RETURNING ${params.returning.join(", ")}`
          : "";

        const values = [
          ...setColumns.map((col) => params.data[col]),
          ...whereColumns.map((col) => params.where[col]),
        ];

        const query = `UPDATE ${params.table} SET ${setClause} WHERE ${whereClause}${returningClause}`;
        const result = await this.pgPool.query(query, values);

        return {
          success: true,
          updatedCount: result.rowCount || 0,
          returning: result.rows.length > 0 ? result.rows : undefined,
        };
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        const setClause = setColumns.map((col) => `${col} = ?`).join(", ");
        const whereClause = whereColumns
          .map((col) => `${col} = ?`)
          .join(" AND ");

        const values = [
          ...setColumns.map((col) => params.data[col]),
          ...whereColumns.map((col) => params.where[col]),
        ];

        const query = `UPDATE ${params.table} SET ${setClause} WHERE ${whereClause}`;
        const result = await this.sqliteDb.run(query, values);

        return {
          success: true,
          updatedCount: result.changes || 0,
        };
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Update operation failed", { error, table: params.table });
      throw error;
    }
  }

  /**
   * Delete records
   */
  async delete(params: DeleteParams): Promise<{
    success: boolean;
    deletedCount: number;
    returning?: unknown[];
  }> {
    logger.info("Deleting records", { table: params.table });

    try {
      const whereColumns = Object.keys(params.where);

      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        const whereClause = whereColumns
          .map((col, idx) => `${col} = $${idx + 1}`)
          .join(" AND ");
        const returningClause = params.returning
          ? ` RETURNING ${params.returning.join(", ")}`
          : "";
        const values = whereColumns.map((col) => params.where[col]);

        const query = `DELETE FROM ${params.table} WHERE ${whereClause}${returningClause}`;
        const result = await this.pgPool.query(query, values);

        return {
          success: true,
          deletedCount: result.rowCount || 0,
          returning: result.rows.length > 0 ? result.rows : undefined,
        };
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        const whereClause = whereColumns
          .map((col) => `${col} = ?`)
          .join(" AND ");
        const values = whereColumns.map((col) => params.where[col]);

        const query = `DELETE FROM ${params.table} WHERE ${whereClause}`;
        const result = await this.sqliteDb.run(query, values);

        return {
          success: true,
          deletedCount: result.changes || 0,
        };
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Delete operation failed", { error, table: params.table });
      throw error;
    }
  }

  /**
   * Execute transactional operations
   */
  async transaction(params: TransactionParams): Promise<{
    success: boolean;
    results: unknown[];
  }> {
    logger.info("Executing transaction", {
      operationCount: params.operations.length,
    });

    try {
      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        const client = await this.pgPool.connect();
        const results: unknown[] = [];

        try {
          await client.query("BEGIN");

          for (const operation of params.operations) {
            let result;

            switch (operation.type) {
              case "query":
                result = await this.executeQueryInTransaction(
                  client,
                  operation.params as QueryParams,
                );
                break;
              case "insert":
                result = await this.executeInsertInTransaction(
                  client,
                  operation.params as InsertParams,
                );
                break;
              case "update":
                result = await this.executeUpdateInTransaction(
                  client,
                  operation.params as UpdateParams,
                );
                break;
              case "delete":
                result = await this.executeDeleteInTransaction(
                  client,
                  operation.params as DeleteParams,
                );
                break;
              default:
                throw new Error(`Unknown operation type: ${operation.type}`);
            }

            results.push(result);
          }

          await client.query("COMMIT");
          logger.info("Transaction committed successfully");

          return { success: true, results };
        } catch (error) {
          await client.query("ROLLBACK");
          logger.error("Transaction rolled back", { error });
          throw error;
        } finally {
          client.release();
        }
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        const results: unknown[] = [];

        try {
          await this.sqliteDb.exec("BEGIN TRANSACTION");

          for (const operation of params.operations) {
            let result;

            switch (operation.type) {
              case "query": {
                const qp = operation.params as QueryParams;
                const rows = await this.sqliteDb.all(qp.query, qp.params);
                result = { rows, rowCount: rows.length };
                break;
              }
              case "insert": {
                const ip = operation.params as InsertParams;
                result = await this.insert(ip);
                break;
              }
              case "update": {
                const up = operation.params as UpdateParams;
                result = await this.update(up);
                break;
              }
              case "delete": {
                const dp = operation.params as DeleteParams;
                result = await this.delete(dp);
                break;
              }
              default:
                throw new Error(`Unknown operation type: ${operation.type}`);
            }

            results.push(result);
          }

          await this.sqliteDb.exec("COMMIT");
          logger.info("Transaction committed successfully");

          return { success: true, results };
        } catch (error) {
          await this.sqliteDb.exec("ROLLBACK");
          logger.error("Transaction rolled back", { error });
          throw error;
        }
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Transaction failed", { error });
      throw error;
    }
  }

  /**
   * Get table schema information
   */
  async getTableInfo(params: { table: string }): Promise<TableInfo> {
    logger.info("Getting table info", { table: params.table });

    try {
      if (this.config.type === "postgresql") {
        if (!this.pgPool) {
          throw new Error("PostgreSQL not connected. Call connect() first.");
        }

        // Get column information
        const columnsQuery = `
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable = 'YES' as nullable,
            column_default as default,
            (SELECT COUNT(*) FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu 
             ON tc.constraint_name = kcu.constraint_name
             WHERE tc.table_name = $1
             AND kcu.column_name = columns.column_name
             AND tc.constraint_type = 'PRIMARY KEY') > 0 as primary_key
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `;

        const columnsResult = await this.pgPool.query(columnsQuery, [
          params.table,
        ]);

        // Get index information
        const indexesQuery = `
          SELECT
            i.relname as name,
            array_agg(a.attname ORDER BY x.ordinality) as columns,
            ix.indisunique as unique
          FROM pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_attribute a ON a.attrelid = t.oid
          JOIN unnest(ix.indkey) WITH ORDINALITY AS x(attnum, ordinality) ON a.attnum = x.attnum
          WHERE t.relname = $1
          GROUP BY i.relname, ix.indisunique
        `;

        const indexesResult = await this.pgPool.query(indexesQuery, [
          params.table,
        ]);

        return {
          columns: columnsResult.rows as never,
          indexes: indexesResult.rows as never,
        };
      } else if (this.config.type === "sqlite") {
        if (!this.sqliteDb) {
          throw new Error("SQLite not connected. Call connect() first.");
        }

        // Get column information
        const columnsResult = await this.sqliteDb.all(
          `PRAGMA table_info(${params.table})`,
        );

        interface SqliteColumnInfo {
          name: string;
          type: string;
          notnull: number;
          dflt_value: unknown;
          pk: number;
        }

        const columns = (columnsResult as SqliteColumnInfo[]).map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
          default: col.dflt_value,
          primaryKey: col.pk === 1,
        }));

        // Get index information
        const indexesResult = await this.sqliteDb.all(
          `PRAGMA index_list(${params.table})`,
        );

        interface SqliteIndexInfo {
          name: string;
          unique: number;
        }

        interface SqliteIndexColumnInfo {
          name: string;
        }

        const indexes = [];
        for (const idx of indexesResult as SqliteIndexInfo[]) {
          const indexInfo = await this.sqliteDb.all(
            `PRAGMA index_info(${idx.name})`,
          );
          indexes.push({
            name: idx.name,
            columns: (indexInfo as SqliteIndexColumnInfo[]).map(
              (info) => info.name,
            ),
            unique: idx.unique === 1,
          });
        }

        return { columns, indexes };
      }

      throw new Error(`Unsupported database type: ${this.config.type}`);
    } catch (error) {
      logger.error("Failed to get table info", { error, table: params.table });
      throw error;
    }
  }

  /**
   * Helper methods for transaction operations
   */
  private async executeQueryInTransaction(
    client: PoolClient,
    params: QueryParams,
  ): Promise<unknown> {
    const result = await client.query(params.query, params.params as unknown[]);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  private async executeInsertInTransaction(
    client: PoolClient,
    params: InsertParams,
  ): Promise<unknown> {
    const records = Array.isArray(params.data) ? params.data : [params.data];
    const columns = Object.keys(records[0]);

    const placeholders = records
      .map((_, idx) => {
        const start = idx * columns.length;
        return `(${columns.map((_, colIdx) => `$${start + colIdx + 1}`).join(", ")})`;
      })
      .join(", ");

    const values = records.flatMap((record) =>
      columns.map((col) => record[col]),
    );
    const returningClause = params.returning
      ? ` RETURNING ${params.returning.join(", ")}`
      : "";
    const query = `INSERT INTO ${params.table} (${columns.join(", ")}) VALUES ${placeholders}${returningClause}`;

    const result = await client.query(query, values);
    return {
      success: true,
      insertedCount: result.rowCount,
      returning: result.rows,
    };
  }

  private async executeUpdateInTransaction(
    client: PoolClient,
    params: UpdateParams,
  ): Promise<unknown> {
    const setColumns = Object.keys(params.data);
    const whereColumns = Object.keys(params.where);

    const setClause = setColumns
      .map((col, idx) => `${col} = $${idx + 1}`)
      .join(", ");
    const whereClause = whereColumns
      .map((col, idx) => `${col} = $${idx + setColumns.length + 1}`)
      .join(" AND ");
    const returningClause = params.returning
      ? ` RETURNING ${params.returning.join(", ")}`
      : "";

    const values = [
      ...setColumns.map((col) => params.data[col]),
      ...whereColumns.map((col) => params.where[col]),
    ];

    const query = `UPDATE ${params.table} SET ${setClause} WHERE ${whereClause}${returningClause}`;
    const result = await client.query(query, values);

    return {
      success: true,
      updatedCount: result.rowCount,
      returning: result.rows,
    };
  }

  private async executeDeleteInTransaction(
    client: PoolClient,
    params: DeleteParams,
  ): Promise<unknown> {
    const whereColumns = Object.keys(params.where);

    const whereClause = whereColumns
      .map((col, idx) => `${col} = $${idx + 1}`)
      .join(" AND ");
    const returningClause = params.returning
      ? ` RETURNING ${params.returning.join(", ")}`
      : "";
    const values = whereColumns.map((col) => params.where[col]);

    const query = `DELETE FROM ${params.table} WHERE ${whereClause}${returningClause}`;
    const result = await client.query(query, values);

    return {
      success: true,
      deletedCount: result.rowCount,
      returning: result.rows,
    };
  }
}

// Singleton instance for default PostgreSQL connection
export const databaseAgent = new DatabaseAgent({
  type: "postgresql",
  useExistingConnection: true,
});
