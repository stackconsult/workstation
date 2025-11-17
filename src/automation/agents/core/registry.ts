/**
 * Agent Registry - Phase 1
 * Manages available agents and their capabilities
 */

import { BrowserAgent } from './browser';
import { logger } from '../../../utils/logger';

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
   * Register default Phase 1 agents
   */
  private registerDefaultAgents(): void {
    // Browser agent capabilities
    this.registerCapability({
      agent_type: 'browser',
      actions: ['navigate', 'click', 'type', 'getText', 'screenshot', 'getContent', 'evaluate'],
      description: 'Browser automation using Playwright'
    });

    logger.info('Default agents registered');
  }

  /**
   * Register agent capability
   */
  registerCapability(capability: AgentCapability): void {
    this.capabilities.push(capability);
    logger.info('Agent capability registered', { agent_type: capability.agent_type });
  }

  /**
   * Get agent instance for execution
   */
  async getAgent(agentType: string, action: string): Promise<AgentAction | null> {
    const key = `${agentType}:${action}`;
    
    // Check if agent exists in cache
    if (this.agents.has(key)) {
      return this.agents.get(key)!;
    }

    // Create new agent instance
    if (agentType === 'browser') {
      const browserAgent = new BrowserAgent();
      await browserAgent.initialize();

      // Return action wrapper
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          try {
            switch (action) {
              case 'navigate': {
                await browserAgent.navigate(params as never);
                return { success: true };
              }
              
              case 'click': {
                await browserAgent.click(params as never);
                return { success: true };
              }
              
              case 'type': {
                await browserAgent.type(params as never);
                return { success: true };
              }
              
              case 'getText': {
                const text = await browserAgent.getText(params.selector as string);
                return { text };
              }
              
              case 'screenshot': {
                const screenshot = await browserAgent.screenshot(params as never);
                return { screenshot: screenshot.toString('base64') };
              }
              
              case 'getContent': {
                const content = await browserAgent.getContent();
                return { content };
              }
              
              case 'evaluate': {
                const result = await browserAgent.evaluate(params.function as never);
                return { result };
              }
              
              default:
                throw new Error(`Unknown action: ${action}`);
            }
          } finally {
            // Cleanup after action
            await browserAgent.cleanup();
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    logger.warn('Unknown agent type requested', { agentType, action });
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
    const capability = this.capabilities.find(c => c.agent_type === agentType);
    return capability ? capability.actions.includes(action) : false;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
