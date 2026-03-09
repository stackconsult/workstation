/**
 * MCP Sync Service for Chrome Extension
 *
 * Provides browser-local MCP synchronization for Chrome extension.
 * Syncs agent status and capabilities every 5 seconds.
 *
 * @module services/mcp-sync-service
 * @version 2.0.0
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { agentOrchestrator } from "./agent-orchestrator";

export interface AgentStatus {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  healthStatus: string;
  lastSync: string;
  capabilities: string[];
}

export interface SyncState {
  lastSync: string;
  agentCount: number;
  healthy: number;
  unhealthy: number;
  syncInterval: number;
  nextSync: string;
}

export class McpSyncService extends EventEmitter {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private syncIntervalMs: number = 5000; // 5 seconds
  private lastSyncTime: Date | null = null;
  private agentCache: Map<string, AgentStatus> = new Map();

  constructor(customInterval?: number) {
    super();
    if (customInterval) {
      this.syncIntervalMs = customInterval;
    }
  }

  /**
   * Start MCP sync service
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn("MCP sync service already running");
      return;
    }

    this.isRunning = true;
    logger.info("Starting MCP sync service", {
      interval: this.syncIntervalMs,
    });

    // Perform initial sync
    this.performSync().catch((error) => {
      logger.error("Initial MCP sync failed", { error: error.message });
    });

    // Schedule periodic syncs
    this.syncInterval = setInterval(() => {
      this.performSync().catch((error) => {
        logger.error("MCP sync failed", { error: error.message });
      });
    }, this.syncIntervalMs);

    this.emit("started", { interval: this.syncIntervalMs });
  }

  /**
   * Stop MCP sync service
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    logger.info("MCP sync service stopped");
    this.emit("stopped");
  }

  /**
   * Perform agent synchronization
   */
  private async performSync(): Promise<void> {
    const syncStartTime = Date.now();

    try {
      // Fetch latest agent status from orchestrator
      const agents = await agentOrchestrator.getAllAgents();

      let healthy = 0;
      let unhealthy = 0;

      // Update cache and count health status
      agents.forEach((agent) => {
        const agentStatus: AgentStatus = {
          id: agent.id,
          name: agent.name,
          status: this.mapStatus(agent.status),
          healthStatus: agent.healthStatus,
          lastSync: new Date().toISOString(),
          capabilities: agent.capabilities || [],
        };

        this.agentCache.set(agent.id, agentStatus);

        if (agent.healthStatus === "healthy") {
          healthy++;
        } else {
          unhealthy++;
        }
      });

      this.lastSyncTime = new Date();
      const syncDuration = Date.now() - syncStartTime;

      logger.debug("MCP sync completed", {
        agentCount: agents.length,
        healthy,
        unhealthy,
        durationMs: syncDuration,
      });

      // Emit sync event with data
      this.emit("sync", {
        agents: Array.from(this.agentCache.values()),
        stats: {
          total: agents.length,
          healthy,
          unhealthy,
        },
        timestamp: this.lastSyncTime.toISOString(),
      });
    } catch (error) {
      logger.error("MCP sync error", { error: (error as Error).message });
      this.emit("error", error);
    }
  }

  /**
   * Map agent status to standard format
   */
  private mapStatus(status: string): "active" | "inactive" | "error" {
    switch (status.toLowerCase()) {
      case "active":
      case "running":
      case "healthy":
        return "active";
      case "error":
      case "failed":
      case "unhealthy":
        return "error";
      default:
        return "inactive";
    }
  }

  /**
   * Get all cached agent statuses
   */
  public getAllAgents(): AgentStatus[] {
    return Array.from(this.agentCache.values());
  }

  /**
   * Get specific agent status
   */
  public getAgent(agentId: string): AgentStatus | undefined {
    return this.agentCache.get(agentId);
  }

  /**
   * Search agents by capability
   */
  public getAgentsByCapability(capability: string): AgentStatus[] {
    return Array.from(this.agentCache.values()).filter((agent) =>
      agent.capabilities.some((cap) =>
        cap.toLowerCase().includes(capability.toLowerCase()),
      ),
    );
  }

  /**
   * Get sync state information
   */
  public getSyncState(): SyncState {
    const healthy = Array.from(this.agentCache.values()).filter(
      (a) => a.healthStatus === "healthy",
    ).length;

    const nextSyncTime = this.lastSyncTime
      ? new Date(this.lastSyncTime.getTime() + this.syncIntervalMs)
      : new Date();

    return {
      lastSync: this.lastSyncTime?.toISOString() || "never",
      agentCount: this.agentCache.size,
      healthy,
      unhealthy: this.agentCache.size - healthy,
      syncInterval: this.syncIntervalMs,
      nextSync: nextSyncTime.toISOString(),
    };
  }

  /**
   * Force immediate sync
   */
  public async forceSyncNow(): Promise<void> {
    logger.info("Force sync requested");
    await this.performSync();
  }

  /**
   * Update sync interval
   */
  public setSyncInterval(intervalMs: number): void {
    if (intervalMs < 1000) {
      throw new Error("Sync interval must be at least 1000ms");
    }

    this.syncIntervalMs = intervalMs;
    logger.info("Sync interval updated", { interval: intervalMs });

    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get service status
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get statistics
   */
  public getStats(): {
    isRunning: boolean;
    lastSync: string | null;
    agentCount: number;
    healthy: number;
    unhealthy: number;
  } {
    const healthy = Array.from(this.agentCache.values()).filter(
      (a) => a.healthStatus === "healthy",
    ).length;

    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime?.toISOString() || null,
      agentCount: this.agentCache.size,
      healthy,
      unhealthy: this.agentCache.size - healthy,
    };
  }
}

// Export singleton instance
let mcpSyncService: McpSyncService | null = null;

export function initializeMcpSyncService(intervalMs?: number): McpSyncService {
  if (!mcpSyncService) {
    mcpSyncService = new McpSyncService(intervalMs);
    mcpSyncService.start();
    logger.info("MCP sync service initialized");
  }
  return mcpSyncService;
}

export function getMcpSyncService(): McpSyncService | null {
  return mcpSyncService;
}
