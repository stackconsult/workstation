/**
 * Entity Store - Context-Memory Intelligence Layer
 *
 * Manages entity tracking, relationships, and persistence across workflow executions.
 * Provides deduplication, query interface, and integration hooks for agents.
 */

import {
  getDatabase,
  generateId,
  getCurrentTimestamp,
} from "../../automation/db/database";
import { logger } from "../../utils/logger";
import {
  Entity,
  EntityContext,
  EntityRelationship,
  EntityQueryOptions,
} from "./types";

/**
 * EntityStore manages entity memory with persistent storage
 */
export class EntityStore {
  private entities: Map<string, Entity> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeSchema().catch((error) => {
      logger.error("Failed to initialize EntityStore schema", { error });
    });
  }

  /**
   * Initialize database schema for entities
   */
  private async initializeSchema(): Promise<void> {
    try {
      const db = getDatabase();

      await db.exec(`
        CREATE TABLE IF NOT EXISTS entities (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          metadata TEXT NOT NULL,
          first_seen TEXT NOT NULL,
          last_seen TEXT NOT NULL,
          access_count INTEGER DEFAULT 1,
          context TEXT NOT NULL,
          tags TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
        CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
        CREATE INDEX IF NOT EXISTS idx_entities_last_seen ON entities(last_seen);

        CREATE TABLE IF NOT EXISTS entity_relationships (
          id TEXT PRIMARY KEY,
          source_entity_id TEXT NOT NULL,
          target_entity_id TEXT NOT NULL,
          relationship_type TEXT NOT NULL,
          strength REAL NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
          FOREIGN KEY(target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_relationships_source ON entity_relationships(source_entity_id);
        CREATE INDEX IF NOT EXISTS idx_relationships_target ON entity_relationships(target_entity_id);
      `);

      this.initialized = true;
      logger.info("EntityStore schema initialized");
    } catch (error) {
      logger.error("EntityStore schema initialization failed", { error });
      throw error;
    }
  }

  /**
   * Track an entity, creating or updating as needed
   */
  async trackEntity(
    type: Entity["type"],
    name: string,
    metadata: Record<string, unknown> = {},
    tags: string[] = [],
  ): Promise<Entity> {
    try {
      const db = getDatabase();
      const timestamp = getCurrentTimestamp();

      // Check if entity exists
      const existing = await this.findEntityByTypeAndName(type, name);

      if (existing) {
        // Update existing entity
        existing.last_seen = timestamp;
        existing.access_count += 1;
        existing.metadata = { ...existing.metadata, ...metadata };
        existing.tags = Array.from(new Set([...existing.tags, ...tags]));

        await db.run(
          `UPDATE entities SET 
            last_seen = ?,
            access_count = ?,
            metadata = ?,
            tags = ?,
            updated_at = ?
          WHERE id = ?`,
          existing.last_seen,
          existing.access_count,
          JSON.stringify(existing.metadata),
          JSON.stringify(existing.tags),
          timestamp,
          existing.id,
        );

        this.entities.set(existing.id, existing);
        logger.debug("Entity updated", { entityId: existing.id, name });
        return existing;
      }

      // Create new entity
      const entityId = generateId();
      const context: EntityContext = {
        relationships: [],
        importance_score: 50, // Default mid-level importance
        workflow_ids: [],
      };

      const entity: Entity = {
        id: entityId,
        type,
        name,
        metadata,
        first_seen: timestamp,
        last_seen: timestamp,
        access_count: 1,
        context,
        tags,
      };

      await db.run(
        `INSERT INTO entities (
          id, type, name, metadata, first_seen, last_seen,
          access_count, context, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        entity.id,
        entity.type,
        entity.name,
        JSON.stringify(entity.metadata),
        entity.first_seen,
        entity.last_seen,
        entity.access_count,
        JSON.stringify(entity.context),
        JSON.stringify(entity.tags),
        timestamp,
        timestamp,
      );

      this.entities.set(entityId, entity);
      logger.info("Entity tracked", { entityId, type, name });
      return entity;
    } catch (error) {
      logger.error("Failed to track entity", { error, type, name });
      throw error;
    }
  }

  /**
   * Find entity by type and name
   */
  private async findEntityByTypeAndName(
    type: Entity["type"],
    name: string,
  ): Promise<Entity | null> {
    try {
      const db = getDatabase();
      const row = await db.get(
        "SELECT * FROM entities WHERE type = ? AND name = ?",
        type,
        name,
      );

      if (!row) {
        return null;
      }

      return this.deserializeEntity(row);
    } catch (error) {
      logger.error("Failed to find entity", { error, type, name });
      return null;
    }
  }

  /**
   * Get entity by ID
   */
  async getEntity(entityId: string): Promise<Entity | null> {
    try {
      // Check cache first
      if (this.entities.has(entityId)) {
        return this.entities.get(entityId)!;
      }

      const db = getDatabase();
      const row = await db.get("SELECT * FROM entities WHERE id = ?", entityId);

      if (!row) {
        return null;
      }

      const entity = this.deserializeEntity(row);
      this.entities.set(entityId, entity);
      return entity;
    } catch (error) {
      logger.error("Failed to get entity", { error, entityId });
      return null;
    }
  }

  /**
   * Query entities with filters
   */
  async queryEntities(options: EntityQueryOptions = {}): Promise<Entity[]> {
    try {
      const db = getDatabase();
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (options.type) {
        conditions.push("type = ?");
        params.push(options.type);
      }

      if (options.workflow_id) {
        // Use JSON function to properly query array elements
        conditions.push(`EXISTS (
          SELECT 1 FROM json_each(context, '$.workflow_ids')
          WHERE value = ?
        )`);
        params.push(options.workflow_id);
      }

      let query = "SELECT * FROM entities";
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      // Add sorting
      // Map sort columns to actual database expressions
      const sortByMap: Record<string, string> = {
        importance: "json_extract(context, '$.importance_score')",
        access_count: "access_count",
        last_seen: "last_seen",
      };
      const defaultSortBy = "last_seen";
      const sortByInput = options.sort_by;
      const sortByKey =
        sortByInput &&
        Object.prototype.hasOwnProperty.call(sortByMap, sortByInput)
          ? sortByInput
          : defaultSortBy;
      const sortByExpr = sortByMap[sortByKey];
      const allowedSortOrder = ["asc", "desc"];
      const defaultSortOrder = "desc";
      const sortOrderInput = (options.sort_order || "").toLowerCase();
      const sortOrder = allowedSortOrder.includes(sortOrderInput)
        ? sortOrderInput
        : defaultSortOrder;
      query += ` ORDER BY ${sortByExpr} ${sortOrder.toUpperCase()}`;

      // Add pagination
      if (options.limit) {
        query += " LIMIT ?";
        params.push(options.limit);
      }

      if (options.offset) {
        query += " OFFSET ?";
        params.push(options.offset);
      }

      const rows = await db.all(query, ...params);
      const entities = rows.map((row) => this.deserializeEntity(row));

      // Apply additional filters (tags, importance)
      let filtered = entities;

      if (options.tags && options.tags.length > 0) {
        filtered = filtered.filter((e) =>
          options.tags!.some((tag) => e.tags.includes(tag)),
        );
      }

      if (options.min_importance !== undefined) {
        filtered = filtered.filter(
          (e) => e.context.importance_score >= options.min_importance!,
        );
      }

      return filtered;
    } catch (error) {
      logger.error("Failed to query entities", { error, options });
      return [];
    }
  }

  /**
   * Create relationship between entities
   */
  async createRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: EntityRelationship["relationship_type"],
    strength: number = 0.5,
  ): Promise<void> {
    try {
      const db = getDatabase();
      const relationshipId = generateId();
      const timestamp = getCurrentTimestamp();

      // Validate strength
      const validStrength = Math.max(0, Math.min(1, strength));

      await db.run(
        `INSERT INTO entity_relationships (
          id, source_entity_id, target_entity_id, relationship_type, strength, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        relationshipId,
        sourceEntityId,
        targetEntityId,
        relationshipType,
        validStrength,
        timestamp,
      );

      // Update source entity context
      const sourceEntity = await this.getEntity(sourceEntityId);
      if (sourceEntity) {
        const relationship: EntityRelationship = {
          entity_id: targetEntityId,
          relationship_type: relationshipType,
          strength: validStrength,
          created_at: timestamp,
        };

        sourceEntity.context.relationships.push(relationship);

        await db.run(
          "UPDATE entities SET context = ?, updated_at = ? WHERE id = ?",
          JSON.stringify(sourceEntity.context),
          timestamp,
          sourceEntityId,
        );

        this.entities.set(sourceEntityId, sourceEntity);
      }

      logger.info("Entity relationship created", {
        sourceEntityId,
        targetEntityId,
        relationshipType,
      });
    } catch (error) {
      logger.error("Failed to create relationship", {
        error,
        sourceEntityId,
        targetEntityId,
      });
      throw error;
    }
  }

  /**
   * Update entity importance score
   */
  async updateImportance(entityId: string, score: number): Promise<void> {
    try {
      const entity = await this.getEntity(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Validate score (0-100)
      entity.context.importance_score = Math.max(0, Math.min(100, score));

      const db = getDatabase();
      await db.run(
        "UPDATE entities SET context = ?, updated_at = ? WHERE id = ?",
        JSON.stringify(entity.context),
        getCurrentTimestamp(),
        entityId,
      );

      this.entities.set(entityId, entity);
      logger.debug("Entity importance updated", { entityId, score });
    } catch (error) {
      logger.error("Failed to update entity importance", { error, entityId });
      throw error;
    }
  }

  /**
   * Associate entity with workflow
   */
  async associateWithWorkflow(
    entityId: string,
    workflowId: string,
  ): Promise<void> {
    try {
      const entity = await this.getEntity(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      if (!entity.context.workflow_ids.includes(workflowId)) {
        entity.context.workflow_ids.push(workflowId);

        const db = getDatabase();
        await db.run(
          "UPDATE entities SET context = ?, updated_at = ? WHERE id = ?",
          JSON.stringify(entity.context),
          getCurrentTimestamp(),
          entityId,
        );

        this.entities.set(entityId, entity);
        logger.debug("Entity associated with workflow", {
          entityId,
          workflowId,
        });
      }
    } catch (error) {
      logger.error("Failed to associate entity with workflow", {
        error,
        entityId,
        workflowId,
      });
      throw error;
    }
  }

  /**
   * Get entities related to a workflow
   */
  async getWorkflowEntities(workflowId: string): Promise<Entity[]> {
    return this.queryEntities({ workflow_id: workflowId });
  }

  /**
   * Clean up old entities
   */
  async cleanupOldEntities(maxAgeDays: number): Promise<number> {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      const cutoff = cutoffDate.toISOString();

      const result = await db.run(
        "DELETE FROM entities WHERE last_seen < ?",
        cutoff,
      );

      const deletedCount = result.changes || 0;
      logger.info("Old entities cleaned up", { deletedCount, maxAgeDays });
      return deletedCount;
    } catch (error) {
      logger.error("Failed to cleanup old entities", { error, maxAgeDays });
      return 0;
    }
  }

  /**
   * Deserialize entity from database row
   */
  private deserializeEntity(row: unknown): Entity {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      type: r.type as Entity["type"],
      name: r.name as string,
      metadata: JSON.parse(r.metadata as string),
      first_seen: r.first_seen as string,
      last_seen: r.last_seen as string,
      access_count: r.access_count as number,
      context: JSON.parse(r.context as string),
      tags: JSON.parse(r.tags as string),
    };
  }

  /**
   * Get statistics about entity store
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    try {
      const db = getDatabase();

      const totalEntities = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM entities",
      );

      const byType = await db.all<Array<{ type: string; count: number }>>(
        "SELECT type, COUNT(*) as count FROM entities GROUP BY type",
      );

      const totalRelationships = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM entity_relationships",
      );

      return {
        total_entities: totalEntities?.count || 0,
        by_type: byType || [],
        total_relationships: totalRelationships?.count || 0,
        cache_size: this.entities.size,
      };
    } catch (error) {
      logger.error("Failed to get entity statistics", { error });
      return {};
    }
  }
}

// Singleton instance
let entityStoreInstance: EntityStore | null = null;

/**
 * Get EntityStore singleton instance
 */
export function getEntityStore(): EntityStore {
  if (!entityStoreInstance) {
    entityStoreInstance = new EntityStore();
  }
  return entityStoreInstance;
}
