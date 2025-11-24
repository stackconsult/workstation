/**
 * Learning Model - Context-Memory Intelligence Layer
 *
 * Provides adaptive learning capabilities based on workflow patterns,
 * generates suggestions for optimization, and learns from feedback.
 */

import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
} from "../../automation/db/database";
import { logger } from "../../utils/logger";
import {
  LearningModel,
  LearningModelSuggestion,
  LearningModelConfig,
  SuggestionFeedback,
  PerformanceSnapshot,
} from "./types";
import { getWorkflowHistory } from "./workflow-history";

/**
 * LearningModelService manages adaptive learning and suggestions
 */
export class LearningModelService {
  private models: Map<string, LearningModel> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeSchema().catch((error) => {
      logger.error("Failed to initialize LearningModel schema", { error });
    });
  }

  /**
   * Initialize database schema for learning models
   */
  private async initializeSchema(): Promise<void> {
    try {
      const db = getDatabase();

      await db.exec(`
        CREATE TABLE IF NOT EXISTS learning_models (
          id TEXT PRIMARY KEY,
          model_type TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          trained_at TEXT NOT NULL,
          accuracy REAL NOT NULL,
          training_samples INTEGER NOT NULL,
          parameters TEXT NOT NULL,
          performance_history TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_models_type ON learning_models(model_type);
        CREATE INDEX IF NOT EXISTS idx_models_accuracy ON learning_models(accuracy);

        CREATE TABLE IF NOT EXISTS learning_suggestions (
          id TEXT PRIMARY KEY,
          model_id TEXT NOT NULL,
          suggestion_type TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence REAL NOT NULL,
          estimated_impact TEXT NOT NULL,
          workflow_id TEXT,
          actionable INTEGER DEFAULT 1,
          auto_apply INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          applied_at TEXT,
          feedback TEXT,
          FOREIGN KEY(model_id) REFERENCES learning_models(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_suggestions_type ON learning_suggestions(suggestion_type);
        CREATE INDEX IF NOT EXISTS idx_suggestions_workflow ON learning_suggestions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_suggestions_created ON learning_suggestions(created_at);
      `);

      this.initialized = true;
      logger.info("LearningModel schema initialized");
    } catch (error) {
      logger.error("LearningModel schema initialization failed", { error });
      throw error;
    }
  }

  /**
   * Train or update a learning model
   */
  async trainModel(config: LearningModelConfig): Promise<LearningModel> {
    try {
      const db = getDatabase();
      const timestamp = getCurrentTimestamp();

      // Get training data based on config
      const trainingData = await this.collectTrainingData(config);

      if (trainingData.length < config.min_samples) {
        throw new Error(
          `Insufficient training data: ${trainingData.length} < ${config.min_samples}`,
        );
      }

      // Check for existing model
      const existing = await this.getModelByType(config.model_type);

      const modelId = existing?.id || generateId();
      const version = existing ? existing.version + 1 : 1;

      // Train the model
      const { accuracy, parameters } = await this.performTraining(
        config.model_type,
        trainingData,
      );

      // Create performance snapshot
      const snapshot: PerformanceSnapshot = {
        timestamp,
        accuracy,
        sample_count: trainingData.length,
      };

      const performanceHistory = existing
        ? [...existing.performance_history, snapshot]
        : [snapshot];

      const model: LearningModel = {
        id: modelId,
        model_type: config.model_type,
        version,
        trained_at: timestamp,
        accuracy,
        training_samples: trainingData.length,
        parameters,
        performance_history: performanceHistory,
      };

      if (existing) {
        // Update existing model
        await db.run(
          `UPDATE learning_models SET 
            version = ?,
            trained_at = ?,
            accuracy = ?,
            training_samples = ?,
            parameters = ?,
            performance_history = ?,
            updated_at = ?
          WHERE id = ?`,
          model.version,
          model.trained_at,
          model.accuracy,
          model.training_samples,
          JSON.stringify(model.parameters),
          JSON.stringify(model.performance_history),
          timestamp,
          modelId,
        );
      } else {
        // Insert new model
        await db.run(
          `INSERT INTO learning_models (
            id, model_type, version, trained_at, accuracy,
            training_samples, parameters, performance_history,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          model.id,
          model.model_type,
          model.version,
          model.trained_at,
          model.accuracy,
          model.training_samples,
          JSON.stringify(model.parameters),
          JSON.stringify(model.performance_history),
          timestamp,
          timestamp,
        );
      }

      this.models.set(modelId, model);
      logger.info("Learning model trained", {
        modelId,
        type: model.model_type,
        version: model.version,
        accuracy: model.accuracy,
      });

      return model;
    } catch (error) {
      logger.error("Failed to train model", { error, config });
      throw error;
    }
  }

  /**
   * Collect training data for a model type
   */
  private async collectTrainingData(
    config: LearningModelConfig,
  ): Promise<Record<string, unknown>[]> {
    try {
      const workflowHistory = getWorkflowHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.training_window_days);

      const records = await workflowHistory.queryHistory({
        start_date: cutoffDate.toISOString(),
        limit: 1000,
      });

      return records.map((record) => ({
        workflow_id: record.workflow_id,
        execution_id: record.execution_id,
        status: record.status,
        duration_ms: record.duration_ms,
        metrics: record.metrics,
        retry_count: record.retry_count,
      }));
    } catch (error) {
      logger.error("Failed to collect training data", { error, config });
      return [];
    }
  }

  /**
   * Perform model training based on type
   */
  private async performTraining(
    modelType: LearningModel["model_type"],
    data: Record<string, unknown>[],
  ): Promise<{ accuracy: number; parameters: Record<string, unknown> }> {
    // Simplified training logic - in production, use actual ML algorithms
    switch (modelType) {
      case "workflow_optimization":
        return this.trainWorkflowOptimization(data);

      case "error_prediction":
        return this.trainErrorPrediction(data);

      case "resource_allocation":
        return this.trainResourceAllocation(data);

      case "task_sequencing":
        return this.trainTaskSequencing(data);

      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
  }

  /**
   * Train workflow optimization model
   */
  private async trainWorkflowOptimization(
    data: Record<string, unknown>[],
  ): Promise<{ accuracy: number; parameters: Record<string, unknown> }> {
    // Analyze successful workflows for optimization patterns
    const successful = data.filter((d) => d.status === "success");

    if (successful.length === 0) {
      return { accuracy: 0.5, parameters: {} };
    }

    // Calculate average metrics
    const avgDuration =
      successful.reduce((sum, d) => {
        const duration = (d.duration_ms as number) || 0;
        return sum + duration;
      }, 0) / successful.length;

    // Identify fast workflows (below average)
    const fastWorkflows = successful.filter((d) => {
      const duration = (d.duration_ms as number) || 0;
      return duration < avgDuration;
    });

    const accuracy = fastWorkflows.length / successful.length;

    const parameters = {
      avg_duration_ms: avgDuration,
      fast_workflow_threshold: avgDuration * 0.8,
      sample_size: successful.length,
    };

    return { accuracy, parameters };
  }

  /**
   * Train error prediction model
   */
  private async trainErrorPrediction(
    data: Record<string, unknown>[],
  ): Promise<{ accuracy: number; parameters: Record<string, unknown> }> {
    const failed = data.filter((d) => d.status === "failure");
    const totalCount = data.length;

    if (totalCount === 0) {
      return { accuracy: 0.5, parameters: {} };
    }

    const failureRate = failed.length / totalCount;

    // Analyze retry patterns
    const avgRetries =
      failed.reduce((sum, d) => {
        const retries = (d.retry_count as number) || 0;
        return sum + retries;
      }, 0) / (failed.length || 1);

    const accuracy = 1 - failureRate;

    const parameters = {
      failure_rate: failureRate,
      avg_retries: avgRetries,
      total_failures: failed.length,
      sample_size: totalCount,
    };

    return { accuracy, parameters };
  }

  /**
   * Train resource allocation model
   */
  private async trainResourceAllocation(
    data: Record<string, unknown>[],
  ): Promise<{ accuracy: number; parameters: Record<string, unknown> }> {
    // Analyze resource usage patterns
    const withMetrics = data.filter((d) => {
      const metrics = d.metrics as Record<string, unknown>;
      return metrics && metrics.resource_usage;
    });

    if (withMetrics.length === 0) {
      return { accuracy: 0.5, parameters: {} };
    }

    const accuracy = withMetrics.length / data.length;

    const parameters = {
      workflows_with_metrics: withMetrics.length,
      sample_size: data.length,
    };

    return { accuracy, parameters };
  }

  /**
   * Train task sequencing model
   */
  private async trainTaskSequencing(
    data: Record<string, unknown>[],
  ): Promise<{ accuracy: number; parameters: Record<string, unknown> }> {
    const successful = data.filter((d) => d.status === "success");

    if (successful.length === 0) {
      return { accuracy: 0.5, parameters: {} };
    }

    // Analyze task completion patterns
    const avgTaskCount =
      successful.reduce((sum, d) => {
        const metrics = d.metrics as Record<string, unknown>;
        const taskCount = (metrics?.task_count as number) || 0;
        return sum + taskCount;
      }, 0) / successful.length;

    const accuracy = 0.7 + (successful.length / data.length) * 0.3;

    const parameters = {
      avg_task_count: avgTaskCount,
      successful_workflows: successful.length,
      sample_size: data.length,
    };

    return { accuracy, parameters };
  }

  /**
   * Generate suggestions based on model
   */
  async generateSuggestions(
    modelId: string,
    workflowId?: string,
  ): Promise<LearningModelSuggestion[]> {
    try {
      const model = await this.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const suggestions: LearningModelSuggestion[] = [];

      // Generate suggestions based on model type
      switch (model.model_type) {
        case "workflow_optimization":
          suggestions.push(
            ...(await this.generateOptimizationSuggestions(model, workflowId)),
          );
          break;

        case "error_prediction":
          suggestions.push(
            ...(await this.generateErrorPreventionSuggestions(
              model,
              workflowId,
            )),
          );
          break;

        case "resource_allocation":
          suggestions.push(
            ...(await this.generateResourceSuggestions(model, workflowId)),
          );
          break;

        case "task_sequencing":
          suggestions.push(
            ...(await this.generateSequencingSuggestions(model, workflowId)),
          );
          break;
      }

      // Save suggestions to database
      for (const suggestion of suggestions) {
        await this.saveSuggestion(modelId, suggestion);
      }

      return suggestions;
    } catch (error) {
      logger.error("Failed to generate suggestions", { error, modelId });
      return [];
    }
  }

  /**
   * Generate workflow optimization suggestions
   */
  private async generateOptimizationSuggestions(
    model: LearningModel,
    workflowId?: string,
  ): Promise<LearningModelSuggestion[]> {
    const suggestions: LearningModelSuggestion[] = [];
    const params = model.parameters;

    if (
      params.avg_duration_ms &&
      typeof params.avg_duration_ms === "number" &&
      params.avg_duration_ms > 60000
    ) {
      const suggestionId = generateId();
      const avgDuration = params.avg_duration_ms as number;
      suggestions.push({
        id: suggestionId,
        suggestion_type: "workflow_optimization",
        description: `Workflow average execution time is ${Math.round(avgDuration / 1000)}s. Consider task parallelization.`,
        confidence: model.accuracy,
        estimated_impact: {
          time_savings_ms: avgDuration * 0.3,
        },
        workflow_id: workflowId,
        actionable: true,
        auto_apply: false,
        created_at: getCurrentTimestamp(),
      });
    }

    return suggestions;
  }

  /**
   * Generate error prevention suggestions
   */
  private async generateErrorPreventionSuggestions(
    model: LearningModel,
    workflowId?: string,
  ): Promise<LearningModelSuggestion[]> {
    const suggestions: LearningModelSuggestion[] = [];
    const params = model.parameters;

    if (params.failure_rate && (params.failure_rate as number) > 0.1) {
      const suggestionId = generateId();
      suggestions.push({
        id: suggestionId,
        suggestion_type: "error_prevention",
        description: `Failure rate is ${Math.round((params.failure_rate as number) * 100)}%. Add error handling and validation.`,
        confidence: model.accuracy,
        estimated_impact: {
          error_reduction_percent: 50,
        },
        workflow_id: workflowId,
        actionable: true,
        auto_apply: false,
        created_at: getCurrentTimestamp(),
      });
    }

    return suggestions;
  }

  /**
   * Generate resource allocation suggestions
   */
  private async generateResourceSuggestions(
    model: LearningModel,
    workflowId?: string,
  ): Promise<LearningModelSuggestion[]> {
    const suggestions: LearningModelSuggestion[] = [];

    // Placeholder for resource-based suggestions
    if (model.accuracy > 0.7) {
      const suggestionId = generateId();
      suggestions.push({
        id: suggestionId,
        suggestion_type: "resource_tuning",
        description:
          "Consider implementing resource monitoring for better allocation",
        confidence: model.accuracy,
        estimated_impact: {
          resource_savings_percent: 20,
        },
        workflow_id: workflowId,
        actionable: true,
        auto_apply: false,
        created_at: getCurrentTimestamp(),
      });
    }

    return suggestions;
  }

  /**
   * Generate task sequencing suggestions
   */
  private async generateSequencingSuggestions(
    model: LearningModel,
    workflowId?: string,
  ): Promise<LearningModelSuggestion[]> {
    const suggestions: LearningModelSuggestion[] = [];
    const params = model.parameters;

    if (params.avg_task_count && (params.avg_task_count as number) > 5) {
      const suggestionId = generateId();
      suggestions.push({
        id: suggestionId,
        suggestion_type: "sequence_improvement",
        description: `Workflow has ${params.avg_task_count} tasks on average. Consider grouping related tasks.`,
        confidence: model.accuracy,
        estimated_impact: {
          time_savings_ms: 5000,
        },
        workflow_id: workflowId,
        actionable: true,
        auto_apply: false,
        created_at: getCurrentTimestamp(),
      });
    }

    return suggestions;
  }

  /**
   * Save suggestion to database
   */
  private async saveSuggestion(
    modelId: string,
    suggestion: LearningModelSuggestion,
  ): Promise<void> {
    try {
      const db = getDatabase();

      await db.run(
        `INSERT INTO learning_suggestions (
          id, model_id, suggestion_type, description, confidence,
          estimated_impact, workflow_id, actionable, auto_apply, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        suggestion.id,
        modelId,
        suggestion.suggestion_type,
        suggestion.description,
        suggestion.confidence,
        JSON.stringify(suggestion.estimated_impact),
        suggestion.workflow_id,
        suggestion.actionable ? 1 : 0,
        suggestion.auto_apply ? 1 : 0,
        suggestion.created_at,
      );

      logger.info("Suggestion saved", {
        suggestionId: suggestion.id,
        type: suggestion.suggestion_type,
      });
    } catch (error) {
      logger.error("Failed to save suggestion", { error, suggestion });
    }
  }

  /**
   * Get suggestions for a workflow
   */
  async getWorkflowSuggestions(
    workflowId: string,
  ): Promise<LearningModelSuggestion[]> {
    try {
      const db = getDatabase();
      const rows = await db.all(
        `SELECT * FROM learning_suggestions 
         WHERE workflow_id = ? AND applied_at IS NULL
         ORDER BY confidence DESC, created_at DESC`,
        workflowId,
      );

      return rows.map((row) => this.deserializeSuggestion(row));
    } catch (error) {
      logger.error("Failed to get workflow suggestions", { error, workflowId });
      return [];
    }
  }

  /**
   * Apply suggestion and record feedback
   */
  async applySuggestion(
    suggestionId: string,
    feedback: SuggestionFeedback,
  ): Promise<void> {
    try {
      const db = getDatabase();
      const timestamp = getCurrentTimestamp();

      await db.run(
        `UPDATE learning_suggestions SET 
          applied_at = ?,
          feedback = ?
        WHERE id = ?`,
        timestamp,
        JSON.stringify(feedback),
        suggestionId,
      );

      logger.info("Suggestion applied with feedback", {
        suggestionId,
        feedback,
      });
    } catch (error) {
      logger.error("Failed to apply suggestion", { error, suggestionId });
      throw error;
    }
  }

  /**
   * Get model by ID
   */
  async getModel(modelId: string): Promise<LearningModel | null> {
    try {
      if (this.models.has(modelId)) {
        return this.models.get(modelId)!;
      }

      const db = getDatabase();
      const row = await db.get(
        "SELECT * FROM learning_models WHERE id = ?",
        modelId,
      );

      if (!row) {
        return null;
      }

      const model = this.deserializeModel(row);
      this.models.set(modelId, model);
      return model;
    } catch (error) {
      logger.error("Failed to get model", { error, modelId });
      return null;
    }
  }

  /**
   * Get model by type
   */
  async getModelByType(
    modelType: LearningModel["model_type"],
  ): Promise<LearningModel | null> {
    try {
      const db = getDatabase();
      const row = await db.get(
        "SELECT * FROM learning_models WHERE model_type = ? ORDER BY version DESC LIMIT 1",
        modelType,
      );

      if (!row) {
        return null;
      }

      return this.deserializeModel(row);
    } catch (error) {
      logger.error("Failed to get model by type", { error, modelType });
      return null;
    }
  }

  /**
   * Deserialize model from database row
   */
  private deserializeModel(row: unknown): LearningModel {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      model_type: r.model_type as LearningModel["model_type"],
      version: r.version as number,
      trained_at: r.trained_at as string,
      accuracy: r.accuracy as number,
      training_samples: r.training_samples as number,
      parameters: JSON.parse(r.parameters as string),
      performance_history: JSON.parse(r.performance_history as string),
    };
  }

  /**
   * Deserialize suggestion from database row
   */
  private deserializeSuggestion(row: unknown): LearningModelSuggestion {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      suggestion_type:
        r.suggestion_type as LearningModelSuggestion["suggestion_type"],
      description: r.description as string,
      confidence: r.confidence as number,
      estimated_impact: JSON.parse(r.estimated_impact as string),
      workflow_id: r.workflow_id as string | undefined,
      actionable: r.actionable === 1,
      auto_apply: r.auto_apply === 1,
      created_at: r.created_at as string,
      applied_at: r.applied_at as string | undefined,
      feedback: r.feedback ? JSON.parse(r.feedback as string) : undefined,
    };
  }
}

// Singleton instance
let learningModelInstance: LearningModelService | null = null;

/**
 * Get LearningModelService singleton instance
 */
export function getLearningModel(): LearningModelService {
  if (!learningModelInstance) {
    learningModelInstance = new LearningModelService();
  }
  return learningModelInstance;
}
