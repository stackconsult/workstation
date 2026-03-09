/**
 * Workflow History - Context-Memory Intelligence Layer
 *
 * Tracks workflow execution history, performance metrics, and pattern detection
 * for continuous improvement and optimization.
 */

import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
} from "../../automation/db/database";
import { logger } from "../../utils/logger";
import {
  WorkflowHistoryRecord,
  ExecutionMetrics,
  WorkflowPattern,
  WorkflowHistoryQueryOptions,
} from "./types";

/**
 * WorkflowHistory manages execution tracking and pattern analysis
 */
export class WorkflowHistory {
  private patterns: Map<string, WorkflowPattern> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeSchema().catch((error) => {
      logger.error("Failed to initialize WorkflowHistory schema", { error });
    });
  }

  /**
   * Initialize database schema for workflow history
   */
  private async initializeSchema(): Promise<void> {
    try {
      const db = getDatabase();

      await db.exec(`
        CREATE TABLE IF NOT EXISTS workflow_history (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          execution_id TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          duration_ms INTEGER,
          status TEXT NOT NULL,
          metrics TEXT NOT NULL,
          entities_accessed TEXT NOT NULL,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
          FOREIGN KEY(execution_id) REFERENCES executions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_history_workflow ON workflow_history(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_history_execution ON workflow_history(execution_id);
        CREATE INDEX IF NOT EXISTS idx_history_status ON workflow_history(status);
        CREATE INDEX IF NOT EXISTS idx_history_started ON workflow_history(started_at);

        CREATE TABLE IF NOT EXISTS workflow_patterns (
          id TEXT PRIMARY KEY,
          pattern_type TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence REAL NOT NULL,
          occurrences INTEGER DEFAULT 1,
          first_detected TEXT NOT NULL,
          last_detected TEXT NOT NULL,
          workflow_ids TEXT NOT NULL,
          recommendation TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_patterns_type ON workflow_patterns(pattern_type);
        CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON workflow_patterns(confidence);
      `);

      this.initialized = true;
      logger.info("WorkflowHistory schema initialized");
    } catch (error) {
      logger.error("WorkflowHistory schema initialization failed", { error });
      throw error;
    }
  }

  /**
   * Record workflow execution
   */
  async recordExecution(
    workflowId: string,
    executionId: string,
    status: WorkflowHistoryRecord["status"],
    metrics: ExecutionMetrics,
    entitiesAccessed: string[] = [],
    errorMessage?: string,
    retryCount: number = 0,
  ): Promise<WorkflowHistoryRecord> {
    try {
      const db = getDatabase();
      const recordId = generateId();
      const timestamp = getCurrentTimestamp();

      const record: WorkflowHistoryRecord = {
        id: recordId,
        workflow_id: workflowId,
        execution_id: executionId,
        started_at: timestamp,
        status,
        metrics,
        entities_accessed: entitiesAccessed,
        error_message: errorMessage,
        retry_count: retryCount,
      };

      await db.run(
        `INSERT INTO workflow_history (
          id, workflow_id, execution_id, started_at, status,
          metrics, entities_accessed, error_message, retry_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.workflow_id,
        record.execution_id,
        record.started_at,
        record.status,
        JSON.stringify(record.metrics),
        JSON.stringify(record.entities_accessed),
        record.error_message,
        record.retry_count,
        timestamp,
      );

      logger.info("Workflow execution recorded", {
        recordId,
        workflowId,
        executionId,
        status,
      });

      return record;
    } catch (error) {
      logger.error("Failed to record workflow execution", {
        error,
        workflowId,
        executionId,
      });
      throw error;
    }
  }

  /**
   * Update execution completion
   */
  async completeExecution(
    recordId: string,
    status: WorkflowHistoryRecord["status"],
    durationMs: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const db = getDatabase();
      const completedAt = getCurrentTimestamp();

      await db.run(
        `UPDATE workflow_history SET 
          completed_at = ?,
          duration_ms = ?,
          status = ?,
          error_message = ?
        WHERE id = ?`,
        completedAt,
        durationMs,
        status,
        errorMessage,
        recordId,
      );

      logger.info("Workflow execution completed", {
        recordId,
        status,
        durationMs,
      });

      // Trigger pattern detection asynchronously
      this.detectPatternsAsync(recordId).catch((err) => {
        logger.warn("Pattern detection failed", { error: err, recordId });
      });
    } catch (error) {
      logger.error("Failed to complete execution", { error, recordId });
      throw error;
    }
  }

  /**
   * Query workflow history
   */
  async queryHistory(
    options: WorkflowHistoryQueryOptions = {},
  ): Promise<WorkflowHistoryRecord[]> {
    try {
      const db = getDatabase();
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (options.workflow_id) {
        conditions.push("workflow_id = ?");
        params.push(options.workflow_id);
      }

      if (options.status) {
        conditions.push("status = ?");
        params.push(options.status);
      }

      if (options.start_date) {
        conditions.push("started_at >= ?");
        params.push(options.start_date);
      }

      if (options.end_date) {
        conditions.push("started_at <= ?");
        params.push(options.end_date);
      }

      let query = "SELECT * FROM workflow_history";
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY started_at DESC";

      if (options.limit) {
        query += " LIMIT ?";
        params.push(options.limit);
      }

      if (options.offset) {
        query += " OFFSET ?";
        params.push(options.offset);
      }

      const rows = await db.all(query, ...params);
      return rows.map((row) => this.deserializeRecord(row));
    } catch (error) {
      logger.error("Failed to query workflow history", { error, options });
      return [];
    }
  }

  /**
   * Get execution statistics for a workflow
   */
  async getWorkflowStatistics(
    workflowId: string,
  ): Promise<Record<string, unknown>> {
    try {
      const db = getDatabase();

      const total = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM workflow_history WHERE workflow_id = ?",
        workflowId,
      );

      const byStatus = await db.all<Array<{ status: string; count: number }>>(
        `SELECT status, COUNT(*) as count 
         FROM workflow_history 
         WHERE workflow_id = ? 
         GROUP BY status`,
        workflowId,
      );

      const avgDuration = await db.get<{ avg_duration: number }>(
        `SELECT AVG(duration_ms) as avg_duration 
         FROM workflow_history 
         WHERE workflow_id = ? AND duration_ms IS NOT NULL`,
        workflowId,
      );

      const recentExecutions = await this.queryHistory({
        workflow_id: workflowId,
        limit: 10,
      });

      return {
        total_executions: total?.count || 0,
        by_status: byStatus || [],
        average_duration_ms: avgDuration?.avg_duration || 0,
        recent_executions: recentExecutions,
      };
    } catch (error) {
      logger.error("Failed to get workflow statistics", { error, workflowId });
      return {};
    }
  }

  /**
   * Detect patterns asynchronously
   */
  private async detectPatternsAsync(recordId: string): Promise<void> {
    try {
      const record = await this.getRecord(recordId);
      if (!record) {
        return;
      }

      // Analyze for failure patterns
      if (record.status === "failure") {
        await this.detectFailurePattern(record);
      }

      // Analyze for performance bottlenecks
      if (record.duration_ms && record.duration_ms > 0) {
        await this.detectPerformancePattern(record);
      }

      // Analyze for success sequences
      if (record.status === "success") {
        await this.detectSuccessPattern(record);
      }
    } catch (error) {
      logger.error("Pattern detection failed", { error, recordId });
    }
  }

  /**
   * Detect failure patterns
   */
  private async detectFailurePattern(
    record: WorkflowHistoryRecord,
  ): Promise<void> {
    try {
      const db = getDatabase();

      // Count recent failures for this workflow
      const recentFailures = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM workflow_history 
         WHERE workflow_id = ? AND status = 'failure' 
         AND started_at > datetime('now', '-7 days')`,
        record.workflow_id,
      );

      const failureCount = recentFailures?.count || 0;

      if (failureCount >= 3) {
        // Create or update failure pattern
        const patternId = `failure_${record.workflow_id}`;
        const confidence = Math.min(failureCount / 10, 1.0); // Max at 10 failures

        const pattern: WorkflowPattern = {
          id: patternId,
          pattern_type: "failure_point",
          description: `Workflow ${record.workflow_id} has failed ${failureCount} times in the past week`,
          confidence,
          occurrences: failureCount,
          first_detected: record.started_at,
          last_detected: record.started_at,
          workflow_ids: [record.workflow_id],
          recommendation:
            "Review workflow configuration and add error handling",
        };

        await this.savePattern(pattern);
      }
    } catch (error) {
      logger.error("Failed to detect failure pattern", { error, record });
    }
  }

  /**
   * Detect performance bottleneck patterns
   */
  private async detectPerformancePattern(
    record: WorkflowHistoryRecord,
  ): Promise<void> {
    try {
      const db = getDatabase();

      // Get average duration for this workflow
      const avgData = await db.get<{ avg_duration: number; count: number }>(
        `SELECT AVG(duration_ms) as avg_duration, COUNT(*) as count 
         FROM workflow_history 
         WHERE workflow_id = ? AND duration_ms IS NOT NULL`,
        record.workflow_id,
      );

      if (!avgData || avgData.count < 5) {
        return; // Not enough data
      }

      const avgDuration = avgData.avg_duration;
      const threshold = avgDuration * 1.5; // 50% slower than average

      // Safely check duration_ms before using it
      if (record.duration_ms == null || record.duration_ms <= threshold) {
        return;
      }
      const durationMs = record.duration_ms;
      const patternId = `bottleneck_${record.workflow_id}`;
      const confidence = Math.min(
        (durationMs - avgDuration) / avgDuration,
        1.0,
      );

      const pattern: WorkflowPattern = {
        id: patternId,
        pattern_type: "performance_bottleneck",
        description: `Workflow execution took ${durationMs}ms, ${Math.round((durationMs / avgDuration - 1) * 100)}% slower than average`,
        confidence,
        occurrences: 1,
        first_detected: record.started_at,
        last_detected: record.started_at,
        workflow_ids: [record.workflow_id],
        recommendation:
          "Review task dependencies and consider parallel execution",
      };

      await this.savePattern(pattern);
    } catch (error) {
      logger.error("Failed to detect performance pattern", { error, record });
    }
  }

  /**
   * Detect success sequence patterns
   */
  private async detectSuccessPattern(
    record: WorkflowHistoryRecord,
  ): Promise<void> {
    try {
      const db = getDatabase();

      // Count consecutive successes
      const recentSuccesses = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM workflow_history 
         WHERE workflow_id = ? AND status = 'success' 
         AND started_at > datetime('now', '-7 days')`,
        record.workflow_id,
      );

      const successCount = recentSuccesses?.count || 0;

      if (successCount >= 10) {
        const patternId = `success_${record.workflow_id}`;

        const pattern: WorkflowPattern = {
          id: patternId,
          pattern_type: "success_sequence",
          description: `Workflow has completed ${successCount} successful executions in the past week`,
          confidence: 0.9,
          occurrences: successCount,
          first_detected: record.started_at,
          last_detected: record.started_at,
          workflow_ids: [record.workflow_id],
          recommendation:
            "Consider increasing execution frequency or expanding workflow scope",
        };

        await this.savePattern(pattern);
      }
    } catch (error) {
      logger.error("Failed to detect success pattern", { error, record });
    }
  }

  /**
   * Save or update pattern
   */
  private async savePattern(pattern: WorkflowPattern): Promise<void> {
    try {
      const db = getDatabase();
      const timestamp = getCurrentTimestamp();

      // Check if pattern exists
      const existing = await db.get(
        "SELECT * FROM workflow_patterns WHERE id = ?",
        pattern.id,
      );

      if (existing) {
        // Update existing pattern
        await db.run(
          `UPDATE workflow_patterns SET 
            occurrences = occurrences + 1,
            confidence = ?,
            last_detected = ?,
            updated_at = ?
          WHERE id = ?`,
          pattern.confidence,
          pattern.last_detected,
          timestamp,
          pattern.id,
        );
      } else {
        // Insert new pattern
        await db.run(
          `INSERT INTO workflow_patterns (
            id, pattern_type, description, confidence, occurrences,
            first_detected, last_detected, workflow_ids, recommendation,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          pattern.id,
          pattern.pattern_type,
          pattern.description,
          pattern.confidence,
          pattern.occurrences,
          pattern.first_detected,
          pattern.last_detected,
          JSON.stringify(pattern.workflow_ids),
          pattern.recommendation,
          timestamp,
          timestamp,
        );
      }

      this.patterns.set(pattern.id, pattern);
      logger.info("Workflow pattern saved", {
        patternId: pattern.id,
        type: pattern.pattern_type,
      });
    } catch (error) {
      logger.error("Failed to save pattern", { error, pattern });
      throw error;
    }
  }

  /**
   * Get patterns for a workflow
   */
  async getWorkflowPatterns(workflowId: string): Promise<WorkflowPattern[]> {
    try {
      const db = getDatabase();
      const rows = await db.all(
        `SELECT * FROM workflow_patterns
         WHERE EXISTS (
           SELECT 1 FROM json_each(workflow_ids)
           WHERE value = ?
         )
         ORDER BY confidence DESC, last_detected DESC`,
        workflowId,
      );

      return rows.map((row) => this.deserializePattern(row));
    } catch (error) {
      logger.error("Failed to get workflow patterns", { error, workflowId });
      return [];
    }
  }

  /**
   * Get all patterns
   */
  async getAllPatterns(
    minConfidence: number = 0.5,
  ): Promise<WorkflowPattern[]> {
    try {
      const db = getDatabase();
      const rows = await db.all(
        `SELECT * FROM workflow_patterns 
         WHERE confidence >= ?
         ORDER BY confidence DESC, last_detected DESC`,
        minConfidence,
      );

      return rows.map((row) => this.deserializePattern(row));
    } catch (error) {
      logger.error("Failed to get all patterns", { error });
      return [];
    }
  }

  /**
   * Get record by ID
   */
  private async getRecord(
    recordId: string,
  ): Promise<WorkflowHistoryRecord | null> {
    try {
      const db = getDatabase();
      const row = await db.get(
        "SELECT * FROM workflow_history WHERE id = ?",
        recordId,
      );

      if (!row) {
        return null;
      }

      return this.deserializeRecord(row);
    } catch (error) {
      logger.error("Failed to get record", { error, recordId });
      return null;
    }
  }

  /**
   * Clean up old history records
   */
  async cleanupOldRecords(maxAgeDays: number): Promise<number> {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      const cutoff = cutoffDate.toISOString();

      const result = await db.run(
        "DELETE FROM workflow_history WHERE started_at < ?",
        cutoff,
      );

      const deletedCount = result.changes || 0;
      logger.info("Old history records cleaned up", {
        deletedCount,
        maxAgeDays,
      });
      return deletedCount;
    } catch (error) {
      logger.error("Failed to cleanup old records", { error, maxAgeDays });
      return 0;
    }
  }

  /**
   * Deserialize record from database row
   */
  private deserializeRecord(row: unknown): WorkflowHistoryRecord {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      workflow_id: r.workflow_id as string,
      execution_id: r.execution_id as string,
      started_at: r.started_at as string,
      completed_at: r.completed_at as string | undefined,
      duration_ms: r.duration_ms as number | undefined,
      status: r.status as WorkflowHistoryRecord["status"],
      metrics: JSON.parse(r.metrics as string),
      entities_accessed: JSON.parse(r.entities_accessed as string),
      error_message: r.error_message as string | undefined,
      retry_count: r.retry_count as number,
    };
  }

  /**
   * Deserialize pattern from database row
   */
  private deserializePattern(row: unknown): WorkflowPattern {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      pattern_type: r.pattern_type as WorkflowPattern["pattern_type"],
      description: r.description as string,
      confidence: r.confidence as number,
      occurrences: r.occurrences as number,
      first_detected: r.first_detected as string,
      last_detected: r.last_detected as string,
      workflow_ids: JSON.parse(r.workflow_ids as string),
      recommendation: r.recommendation as string | undefined,
    };
  }
}

// Singleton instance
let workflowHistoryInstance: WorkflowHistory | null = null;

/**
 * Get WorkflowHistory singleton instance
 */
export function getWorkflowHistory(): WorkflowHistory {
  if (!workflowHistoryInstance) {
    workflowHistoryInstance = new WorkflowHistory();
  }
  return workflowHistoryInstance;
}
