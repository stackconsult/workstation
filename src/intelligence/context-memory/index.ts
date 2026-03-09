/**
 * Context-Memory Intelligence Layer - Main Export
 *
 * Provides unified access to entity store, workflow history, and learning model
 */

export * from "./types";
export * from "./entity-store";
export * from "./workflow-history";
export * from "./learning-model";

import { getEntityStore } from "./entity-store";
import { getWorkflowHistory } from "./workflow-history";
import { getLearningModel } from "./learning-model";
import { logger } from "../../utils/logger";

/**
 * Initialize all context-memory components
 */
export async function initializeContextMemory(): Promise<void> {
  try {
    logger.info("Initializing context-memory intelligence layer...");

    // Initialize components (they auto-initialize on first use)
    getEntityStore();
    getWorkflowHistory();
    getLearningModel();

    logger.info("Context-memory intelligence layer initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize context-memory", { error });
    throw error;
  }
}

/**
 * Get all context-memory services
 */
export function getContextMemoryServices() {
  return {
    entityStore: getEntityStore(),
    workflowHistory: getWorkflowHistory(),
    learningModel: getLearningModel(),
  };
}
