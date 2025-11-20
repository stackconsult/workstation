/**
 * Agent Registry - Phase 1 & Phase 10
 * Manages available agents and their capabilities
 */

import { BrowserAgent } from "./browser";
import { EmailAgent } from "../integration/email";
import { FileAgent } from "../storage/file";
import { RssAgent } from "../data/rss";
import { logger } from "../../../utils/logger";

export interface AgentCapability {
  agent_type: string;
  actions: string[];
  description: string;
}

export interface AgentAction {
  execute(params: Record<string, unknown>): Promise<unknown>;
}

export class AgentRegistry {
  private agents: Map<string, AgentAction> = new Map();
  private capabilities: AgentCapability[] = [];

  constructor() {
    this.registerDefaultAgents();
  }

  /**
   * Register default Phase 1 & Phase 10 agents
   */
  private registerDefaultAgents(): void {
    // Browser agent capabilities
    this.registerCapability({
      agent_type: "browser",
      actions: [
        "navigate",
        "click",
        "type",
        "getText",
        "screenshot",
        "getContent",
        "evaluate",
      ],
      description: "Browser automation using Playwright",
    });

    // Phase 10: Workspace automation agents
    this.registerCapability({
      agent_type: "email",
      actions: ["sendEmail", "getUnreadEmails", "markAsRead", "createFilter"],
      description: "Email automation (Gmail, Outlook, IMAP/SMTP)",
    });

    this.registerCapability({
      agent_type: "file",
      actions: [
        "readFile",
        "writeFile",
        "listFiles",
        "createDirectory",
        "deleteFile",
        "moveFile",
        "copyFile",
        "searchFiles",
      ],
      description: "File system operations (local and cloud storage)",
    });

    this.registerCapability({
      agent_type: "rss",
      actions: [
        "fetchFeed",
        "extractClientInfo",
        "buildClientRepository",
        "monitorFeeds",
      ],
      description: "RSS feed parsing and client intelligence gathering",
    });

    logger.info("Default agents registered", {
      count: this.capabilities.length,
    });
  }

  /**
   * Register agent capability
   */
  registerCapability(capability: AgentCapability): void {
    this.capabilities.push(capability);
    logger.info("Agent capability registered", {
      agent_type: capability.agent_type,
    });
  }

  /**
   * Get agent instance for execution
   */
  async getAgent(
    agentType: string,
    action: string,
  ): Promise<AgentAction | null> {
    const key = `${agentType}:${action}`;

    // Check if agent exists in cache
    if (this.agents.has(key)) {
      return this.agents.get(key)!;
    }

    // Create new agent instance
    if (agentType === "browser") {
      const browserAgent = new BrowserAgent();
      await browserAgent.initialize();

      // Return action wrapper
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          try {
            switch (action) {
              case "navigate": {
                await browserAgent.navigate(params as never);
                return { success: true };
              }

              case "click": {
                await browserAgent.click(params as never);
                return { success: true };
              }

              case "type": {
                await browserAgent.type(params as never);
                return { success: true };
              }

              case "getText": {
                const text = await browserAgent.getText(
                  params.selector as string,
                );
                return { text };
              }

              case "screenshot": {
                const screenshot = await browserAgent.screenshot(
                  params as never,
                );
                return { screenshot: screenshot.toString("base64") };
              }

              case "getContent": {
                const content = await browserAgent.getContent();
                return { content };
              }

              case "evaluate": {
                const result = await browserAgent.evaluate(
                  params.function as never,
                );
                return { result };
              }

              default:
                throw new Error(`Unknown action: ${action}`);
            }
          } finally {
            // Cleanup after action
            await browserAgent.cleanup();
          }
        },
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: Email agent
    if (agentType === "email") {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // Email config should be passed in params or retrieved from workspace config
          const emailConfig = (params as any).emailConfig || {
            provider: "gmail" as const,
            email: "default@example.com",
          };

          const emailAgent = new EmailAgent(emailConfig);
          await emailAgent.connect();

          try {
            switch (action) {
              case "sendEmail":
                return await emailAgent.sendEmail(params as never);
              case "getUnreadEmails":
                return await emailAgent.getUnreadEmails(params as never);
              case "markAsRead":
                return await emailAgent.markAsRead(params.emailIds as string[]);
              case "createFilter":
                return await emailAgent.createFilter(params as never);
              default:
                throw new Error(`Unknown email action: ${action}`);
            }
          } finally {
            await emailAgent.disconnect();
          }
        },
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: File agent
    if (agentType === "file") {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          const fileConfig = (params as any).fileConfig || {
            storageType: "local" as const,
            basePath: "/tmp/workstation",
          };

          const fileAgent = new FileAgent(fileConfig);

          switch (action) {
            case "readFile":
              return await fileAgent.readFile(params as never);
            case "writeFile":
              return await fileAgent.writeFile(params as never);
            case "listFiles":
              return await fileAgent.listFiles(params as never);
            case "createDirectory":
              return await fileAgent.createDirectory(params as never);
            case "deleteFile":
              return await fileAgent.deleteFile(params as never);
            case "moveFile":
              return await fileAgent.moveFile(params as never);
            case "copyFile":
              return await fileAgent.copyFile(params as never);
            case "searchFiles":
              return await fileAgent.searchFiles(params as never);
            default:
              throw new Error(`Unknown file action: ${action}`);
          }
        },
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: RSS agent
    if (agentType === "rss") {
      const rssAgent = new RssAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case "fetchFeed":
              return await rssAgent.fetchFeed(params as never);
            case "extractClientInfo":
              return await rssAgent.extractClientInfo(params as never);
            case "buildClientRepository":
              return await rssAgent.buildClientRepository(params as never);
            case "monitorFeeds":
              return await rssAgent.monitorFeeds(params as never);
            default:
              throw new Error(`Unknown RSS action: ${action}`);
          }
        },
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    logger.warn("Unknown agent type requested", { agentType, action });
    return null;
  }

  /**
   * Get all available capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Check if agent supports action
   */
  supportsAction(agentType: string, action: string): boolean {
    const capability = this.capabilities.find(
      (c) => c.agent_type === agentType,
    );
    return capability ? capability.actions.includes(action) : false;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
