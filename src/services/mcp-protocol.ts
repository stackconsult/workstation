/**
 * MCP (Model Context Protocol) Implementation
 * Handles protocol-level communication between backend and MCP containers
 */

import {
  getMessageBroker,
  MCPMessage,
  StatusMessage,
  ResultMessage,
} from "./message-broker";
import { agentOrchestrator } from "./agent-orchestrator";
import { advancedAutomation } from "./advanced-automation";

export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
  context?: {
    userId?: string;
    workflowId?: string;
    sessionId?: string;
  };
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  method: string;
  params: any;
}

export class MCPProtocol {
  private messageBroker = getMessageBroker();
  private orchestrator = agentOrchestrator;
  private requestHandlers: Map<
    string,
    (params: any, context: any) => Promise<any>
  > = new Map();
  private notificationHandlers: Map<string, (params: any) => void> = new Map();

  constructor() {
    this.setupDefaultHandlers();
    this.setupMessageListeners();
  }

  /**
   * Setup default MCP protocol handlers
   */
  private setupDefaultHandlers(): void {
    // Workflow execution handler
    this.registerRequestHandler("execute_workflow", async (params, context) => {
      const { workflowId, actions } = params;

      // Create task via agent orchestrator
      const taskId = await this.orchestrator.createTask(
        params.agentId || "1", // Default to agent 1
        "execute-workflow",
        { workflowId, actions },
        context.userId || "system",
        params.priority || 5,
      );

      return {
        taskId,
        status: "queued",
        message: "Workflow execution started",
      };
    });

    // Get task status handler
    this.registerRequestHandler("get_task_status", async (params) => {
      const { taskId } = params;
      const status = await this.orchestrator.getTaskStatus(taskId);
      return status;
    });

    // Browser automation handlers
    this.registerRequestHandler("navigate", async (params) => {
      return { method: "navigate", params };
    });

    this.registerRequestHandler("click", async (params) => {
      return { method: "click", params };
    });

    this.registerRequestHandler("fill", async (params) => {
      return { method: "fill", params };
    });

    this.registerRequestHandler("screenshot", async (params) => {
      return { method: "screenshot", params };
    });

    // Advanced Browser Automation - Multi-Tab Management
    this.registerRequestHandler("open_tab", async (params) => {
      const { url } = params;
      const tabId = await advancedAutomation.openNewTab(url);
      return { tabId, url };
    });

    this.registerRequestHandler("switch_tab", async (params) => {
      const { tabId } = params;
      await advancedAutomation.switchToTab(tabId);
      return { success: true, tabId };
    });

    this.registerRequestHandler("close_tab", async (params) => {
      const { tabId } = params;
      await advancedAutomation.closeTab(tabId);
      return { success: true };
    });

    this.registerRequestHandler("list_tabs", async () => {
      const tabs = await advancedAutomation.listTabs();
      return { tabs };
    });

    this.registerRequestHandler("close_all_tabs", async () => {
      await advancedAutomation.closeAllTabs();
      return { success: true };
    });

    // Advanced Browser Automation - iFrame Handling
    this.registerRequestHandler("switch_to_iframe", async (params) => {
      const { selector } = params;
      await advancedAutomation.switchToIframe(selector);
      return { success: true, selector };
    });

    this.registerRequestHandler("switch_to_main_frame", async () => {
      await advancedAutomation.switchToMainFrame();
      return { success: true };
    });

    this.registerRequestHandler("execute_in_iframe", async (params) => {
      const { selector, actions } = params;
      await advancedAutomation.executeInIframe(selector, actions);
      return { success: true, actionsExecuted: actions.length };
    });

    // Advanced Browser Automation - File Operations
    this.registerRequestHandler("upload_file", async (params) => {
      const { selector, filePath } = params;
      await advancedAutomation.uploadFile(selector, filePath);
      return { success: true, filePath };
    });

    this.registerRequestHandler("download_file", async (params) => {
      const { url, savePath } = params;
      const downloadPath = await advancedAutomation.downloadFile(url, savePath);
      return { success: true, downloadPath };
    });

    this.registerRequestHandler("wait_for_download", async (params) => {
      const { timeout } = params;
      const downloadPath = await advancedAutomation.waitForDownload(timeout);
      return { success: true, downloadPath };
    });

    // Advanced Browser Automation - Advanced Interactions
    this.registerRequestHandler("hover", async (params) => {
      const { selector, duration } = params;
      await advancedAutomation.hover(selector, duration);
      return { success: true, selector };
    });

    this.registerRequestHandler("drag_and_drop", async (params) => {
      const { sourceSelector, targetSelector } = params;
      await advancedAutomation.dragAndDrop(sourceSelector, targetSelector);
      return { success: true };
    });

    this.registerRequestHandler("send_keys", async (params) => {
      const { keys } = params;
      await advancedAutomation.sendKeys(keys);
      return { success: true, keys };
    });

    this.registerRequestHandler("press_key", async (params) => {
      const { key } = params;
      await advancedAutomation.pressKey(key);
      return { success: true, key };
    });

    // Advanced Browser Automation - Network Monitoring
    this.registerRequestHandler("start_network_monitoring", async () => {
      await advancedAutomation.startNetworkMonitoring();
      return { success: true, monitoring: true };
    });

    this.registerRequestHandler("stop_network_monitoring", async () => {
      const requests = await advancedAutomation.stopNetworkMonitoring();
      return { success: true, requestCount: requests.length, requests };
    });

    this.registerRequestHandler("intercept_request", async (params) => {
      const { pattern, handler } = params;
      await advancedAutomation.interceptRequest(pattern, handler);
      return { success: true, pattern };
    });

    this.registerRequestHandler("block_request", async (params) => {
      const { pattern } = params;
      await advancedAutomation.blockRequest(pattern);
      return { success: true, pattern };
    });

    // Advanced Browser Automation - Browser Profiles
    this.registerRequestHandler("save_browser_profile", async (params) => {
      const { name } = params;
      await advancedAutomation.saveBrowserProfile(name);
      return { success: true, profileName: name };
    });

    this.registerRequestHandler("load_browser_profile", async (params) => {
      const { name } = params;
      await advancedAutomation.loadBrowserProfile(name);
      return { success: true, profileName: name };
    });

    this.registerRequestHandler("list_profiles", async () => {
      const profiles = await advancedAutomation.listProfiles();
      return { profiles };
    });

    // Advanced Browser Automation - Screenshot & Recording
    this.registerRequestHandler("take_full_page_screenshot", async (params) => {
      const { path } = params;
      const screenshotPath =
        await advancedAutomation.takeFullPageScreenshot(path);
      return { success: true, screenshotPath };
    });

    this.registerRequestHandler("start_video_recording", async (params) => {
      const { path } = params;
      await advancedAutomation.startVideoRecording(path);
      return { success: true, recording: true };
    });

    this.registerRequestHandler("stop_video_recording", async () => {
      const videoPath = await advancedAutomation.stopVideoRecording();
      return { success: true, videoPath };
    });

    // Advanced Browser Automation - Advanced Waiting
    this.registerRequestHandler("wait_for_element", async (params) => {
      const { selector, timeout, visible } = params;
      await advancedAutomation.waitForElement(selector, { timeout, visible });
      return { success: true, selector };
    });

    this.registerRequestHandler("wait_for_navigation", async (params) => {
      const { timeout, waitUntil } = params;
      await advancedAutomation.waitForNavigation({ timeout, waitUntil });
      return { success: true };
    });

    this.registerRequestHandler("wait_for_function", async (params) => {
      const { fn, timeout, polling } = params;
      await advancedAutomation.waitForFunction(fn, { timeout, polling });
      return { success: true };
    });

    // Agent health check
    this.registerRequestHandler("health_check", async (params) => {
      const { agentId } = params;
      const stats = await this.orchestrator.getAgentStatistics(agentId);
      return {
        healthy: stats.healthStatus === "healthy",
        stats,
      };
    });

    // Context management
    this.registerRequestHandler("save_context", async (params, _context) => {
      // Save context for task recall
      return { success: true, contextId: params.contextId };
    });

    this.registerRequestHandler("get_context", async (_params) => {
      // Retrieve saved context
      return { context: {} };
    });
  }

  /**
   * Setup message listeners for bidirectional communication
   */
  private setupMessageListeners(): void {
    // Listen for status updates from agents
    this.messageBroker.listenForStatus((message: StatusMessage) => {
      console.log(
        `[MCPProtocol] Status update from agent ${message.agentId}:`,
        message.payload.status,
      );
      this.handleNotification("task_status_update", {
        taskId: message.taskId,
        agentId: message.agentId,
        status: message.payload.status,
        progress: message.payload.progress,
        message: message.payload.message,
      });
    });

    // Listen for results from agents
    this.messageBroker.listenForResults((message: ResultMessage) => {
      console.log(
        `[MCPProtocol] Result from agent ${message.agentId}:`,
        message.payload.success,
      );
      this.handleNotification("task_completed", {
        taskId: message.taskId,
        agentId: message.agentId,
        success: message.payload.success,
        data: message.payload.data,
        error: message.payload.error,
        duration: message.payload.duration,
      });
    });

    // Listen for heartbeats
    this.messageBroker.listenForHeartbeats((message: MCPMessage) => {
      this.handleNotification("agent_heartbeat", {
        agentId: message.agentId,
        timestamp: message.timestamp,
      });
    });
  }

  /**
   * Register a request handler
   */
  registerRequestHandler(
    method: string,
    handler: (params: any, context: any) => Promise<any>,
  ): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * Register a notification handler
   */
  registerNotificationHandler(
    method: string,
    handler: (params: any) => void,
  ): void {
    this.notificationHandlers.set(method, handler);
  }

  /**
   * Handle an MCP request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const handler = this.requestHandlers.get(request.method);

      if (!handler) {
        return {
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
      }

      const result = await handler(request.params || {}, request.context || {});

      return {
        id: request.id,
        result,
      };
    } catch (error: any) {
      console.error(
        `[MCPProtocol] Error handling request ${request.method}:`,
        error,
      );
      return {
        id: request.id,
        error: {
          code: -32603,
          message: error.message || "Internal error",
          data: error.stack,
        },
      };
    }
  }

  /**
   * Handle an MCP notification
   */
  private handleNotification(method: string, params: any): void {
    const handler = this.notificationHandlers.get(method);
    if (handler) {
      try {
        handler(params);
      } catch (error) {
        console.error(
          `[MCPProtocol] Error handling notification ${method}:`,
          error,
        );
      }
    }
  }

  /**
   * Send a request to an agent
   */
  async sendRequest(
    agentId: string,
    method: string,
    params: any = {},
  ): Promise<any> {
    const request: MCPRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method,
      params,
    };

    return await this.messageBroker.request(agentId, request);
  }

  /**
   * Send a notification to an agent
   */
  async sendNotification(
    agentId: string,
    method: string,
    params: any = {},
  ): Promise<void> {
    // Notification structure for future use
    const _notification: MCPNotification = {
      method,
      params,
    };

    await this.messageBroker.sendCommand(agentId, method, params);
  }

  /**
   * Broadcast a notification to all agents
   */
  async broadcastNotification(method: string, params: any = {}): Promise<void> {
    const notification: MCPNotification = {
      method,
      params,
    };

    const message: MCPMessage = {
      id: `broadcast_${Date.now()}`,
      type: "command",
      agentId: "all",
      payload: notification,
      timestamp: new Date(),
    };

    await this.messageBroker.broadcast(message);
  }

  /**
   * Execute a workflow via MCP protocol
   */
  async executeWorkflow(
    agentId: string,
    workflowId: string,
    actions: any[],
    userId?: string,
  ): Promise<any> {
    const request: MCPRequest = {
      id: `workflow_${Date.now()}`,
      method: "execute_workflow",
      params: {
        agentId,
        workflowId,
        actions,
      },
      context: {
        userId,
        workflowId,
        sessionId: `session_${Date.now()}`,
      },
    };

    return await this.handleRequest(request);
  }

  /**
   * Get Chrome extension wiring configuration
   */
  getChromeExtensionConfig(): any {
    return {
      mcpEndpoint: process.env.MCP_ENDPOINT || "ws://localhost:7042/mcp",
      supportedMethods: Array.from(this.requestHandlers.keys()),
      supportedNotifications: Array.from(this.notificationHandlers.keys()),
      agents: {
        total: 21,
        available: Array.from({ length: 21 }, (_, i) => ({
          id: String(i + 1),
          name: `Agent ${i + 1}`,
          status: "available",
        })),
      },
    };
  }
}

// Singleton instance
let mcpProtocolInstance: MCPProtocol | null = null;

export function getMCPProtocol(): MCPProtocol {
  if (!mcpProtocolInstance) {
    mcpProtocolInstance = new MCPProtocol();
  }
  return mcpProtocolInstance;
}

export default MCPProtocol;
