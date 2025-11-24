/// <reference types="jest" />

/**
 * MCP Protocol Service Test Suite
 * Priority 3: Services Layer Testing (HIGH PRIORITY - 485 LOC)
 * 
 * Tests for:
 * - Protocol initialization
 * - Request handling (workflow execution, task status, browser automation)
 * - Notification handling
 * - Message listeners
 * - Error handling
 * - Handler registration
 * - Chrome extension configuration
 * 
 * Target: 60%+ coverage, 40+ tests
 */

import { MCPProtocol, getMCPProtocol, MCPRequest, MCPResponse } from '../../src/services/mcp-protocol';

// Mock dependencies
jest.mock('../../src/services/message-broker');
jest.mock('../../src/services/agent-orchestrator');
jest.mock('../../src/services/advanced-automation');

// Import mocked modules after mocking
import { getMessageBroker } from '../../src/services/message-broker';
import { agentOrchestrator } from '../../src/services/agent-orchestrator';
import { advancedAutomation } from '../../src/services/advanced-automation';

describe('MCP Protocol Service', () => {
  let protocol: MCPProtocol;
  let mockMessageBroker: any;
  let mockOrchestrator: any;
  let mockAutomation: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock message broker
    mockMessageBroker = {
      listenForStatus: jest.fn(),
      listenForResults: jest.fn(),
      listenForHeartbeats: jest.fn(),
      request: jest.fn(),
      sendCommand: jest.fn(),
      broadcast: jest.fn(),
    };
    (getMessageBroker as jest.Mock).mockReturnValue(mockMessageBroker);

    // Setup mock orchestrator
    mockOrchestrator = {
      createTask: jest.fn().mockResolvedValue('task-123'),
      getTaskStatus: jest.fn().mockResolvedValue({
        id: 'task-123',
        status: 'running',
        progress: 50,
      }),
      getAgentStatistics: jest.fn().mockResolvedValue({
        healthStatus: 'healthy',
        tasksCompleted: 10,
        tasksQueued: 2,
      }),
    };
    Object.assign(agentOrchestrator, mockOrchestrator);

    // Setup mock automation
    mockAutomation = {
      openNewTab: jest.fn().mockResolvedValue('tab-123'),
      switchToTab: jest.fn().mockResolvedValue(undefined),
      closeTab: jest.fn().mockResolvedValue(undefined),
      listTabs: jest.fn().mockResolvedValue([{ id: 'tab-1', url: 'https://example.com' }]),
      closeAllTabs: jest.fn().mockResolvedValue(undefined),
      switchToIframe: jest.fn().mockResolvedValue(undefined),
      switchToMainFrame: jest.fn().mockResolvedValue(undefined),
      executeInIframe: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn().mockResolvedValue(undefined),
      downloadFile: jest.fn().mockResolvedValue('/path/to/download'),
      waitForDownload: jest.fn().mockResolvedValue('/path/to/file'),
      hover: jest.fn().mockResolvedValue(undefined),
      dragAndDrop: jest.fn().mockResolvedValue(undefined),
      sendKeys: jest.fn().mockResolvedValue(undefined),
      pressKey: jest.fn().mockResolvedValue(undefined),
      startNetworkMonitoring: jest.fn().mockResolvedValue(undefined),
      stopNetworkMonitoring: jest.fn().mockResolvedValue([]),
      interceptRequest: jest.fn().mockResolvedValue(undefined),
      blockRequest: jest.fn().mockResolvedValue(undefined),
      saveBrowserProfile: jest.fn().mockResolvedValue(undefined),
      loadBrowserProfile: jest.fn().mockResolvedValue(undefined),
      listProfiles: jest.fn().mockResolvedValue(['profile1', 'profile2']),
      takeFullPageScreenshot: jest.fn().mockResolvedValue('/path/to/screenshot.png'),
      startVideoRecording: jest.fn().mockResolvedValue(undefined),
      stopVideoRecording: jest.fn().mockResolvedValue('/path/to/video.mp4'),
      waitForElement: jest.fn().mockResolvedValue(undefined),
      waitForNavigation: jest.fn().mockResolvedValue(undefined),
      waitForFunction: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(advancedAutomation, mockAutomation);

    // Create new instance for each test
    protocol = new MCPProtocol();
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default handlers', () => {
      expect(protocol).toBeDefined();
      expect(getMessageBroker).toHaveBeenCalled();
    });

    it('should setup message listeners on initialization', () => {
      expect(mockMessageBroker.listenForStatus).toHaveBeenCalled();
      expect(mockMessageBroker.listenForResults).toHaveBeenCalled();
      expect(mockMessageBroker.listenForHeartbeats).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // HANDLER REGISTRATION
  // ============================================================================

  describe('Handler Registration', () => {
    it('should register custom request handler', async () => {
      const customHandler = jest.fn().mockResolvedValue({ custom: 'result' });
      protocol.registerRequestHandler('custom_method', customHandler);

      const request: MCPRequest = {
        id: 'req-123',
        method: 'custom_method',
        params: { test: 'data' },
      };

      const response = await protocol.handleRequest(request);
      expect(response.result).toEqual({ custom: 'result' });
      expect(customHandler).toHaveBeenCalledWith({ test: 'data' }, {});
    });

    it('should register custom notification handler', () => {
      const customHandler = jest.fn();
      protocol.registerNotificationHandler('custom_notification', customHandler);
      expect(protocol).toBeDefined(); // Handler is registered internally
    });

    it('should allow multiple handlers for different methods', async () => {
      const handler1 = jest.fn().mockResolvedValue({ result: 1 });
      const handler2 = jest.fn().mockResolvedValue({ result: 2 });
      
      protocol.registerRequestHandler('method1', handler1);
      protocol.registerRequestHandler('method2', handler2);

      await protocol.handleRequest({ id: 'req-1', method: 'method1' });
      await protocol.handleRequest({ id: 'req-2', method: 'method2' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // REQUEST HANDLING
  // ============================================================================

  describe('Request Handling', () => {
    describe('execute_workflow', () => {
      it('should execute workflow via request handler', async () => {
        const request: MCPRequest = {
          id: 'req-workflow',
          method: 'execute_workflow',
          params: {
            workflowId: 'workflow-123',
            actions: [{ type: 'click', selector: '#button' }],
          },
          context: {
            userId: 'user-123',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toBeDefined();
        expect(response.result.taskId).toBe('task-123');
        expect(response.result.status).toBe('queued');
        expect(mockOrchestrator.createTask).toHaveBeenCalled();
      });

      it('should use default agent ID when not provided', async () => {
        const request: MCPRequest = {
          id: 'req-workflow',
          method: 'execute_workflow',
          params: {
            workflowId: 'workflow-123',
            actions: [],
          },
          context: {},
        };

        await protocol.handleRequest(request);
        expect(mockOrchestrator.createTask).toHaveBeenCalledWith(
          '1', // Default agent
          'execute-workflow',
          expect.any(Object),
          'system', // Default user
          5 // Default priority
        );
      });

      it('should use custom priority when provided', async () => {
        const request: MCPRequest = {
          id: 'req-workflow',
          method: 'execute_workflow',
          params: {
            workflowId: 'workflow-123',
            actions: [],
            priority: 10,
          },
          context: {},
        };

        await protocol.handleRequest(request);
        expect(mockOrchestrator.createTask).toHaveBeenCalledWith(
          '1',
          'execute-workflow',
          expect.any(Object),
          'system',
          10
        );
      });
    });

    describe('get_task_status', () => {
      it('should get task status', async () => {
        const request: MCPRequest = {
          id: 'req-status',
          method: 'get_task_status',
          params: { taskId: 'task-123' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toBeDefined();
        expect(response.result.id).toBe('task-123');
        expect(response.result.status).toBe('running');
        expect(mockOrchestrator.getTaskStatus).toHaveBeenCalledWith('task-123');
      });
    });

    describe('Browser Automation Handlers', () => {
      it('should handle navigate request', async () => {
        const request: MCPRequest = {
          id: 'req-nav',
          method: 'navigate',
          params: { url: 'https://example.com' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toEqual({
          method: 'navigate',
          params: { url: 'https://example.com' },
        });
      });

      it('should handle click request', async () => {
        const request: MCPRequest = {
          id: 'req-click',
          method: 'click',
          params: { selector: '#button' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toEqual({
          method: 'click',
          params: { selector: '#button' },
        });
      });

      it('should handle fill request', async () => {
        const request: MCPRequest = {
          id: 'req-fill',
          method: 'fill',
          params: { selector: '#input', value: 'test' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toEqual({
          method: 'fill',
          params: { selector: '#input', value: 'test' },
        });
      });

      it('should handle screenshot request', async () => {
        const request: MCPRequest = {
          id: 'req-screenshot',
          method: 'screenshot',
          params: { fullPage: true },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result).toEqual({
          method: 'screenshot',
          params: { fullPage: true },
        });
      });
    });

    describe('Multi-Tab Management', () => {
      it('should open new tab', async () => {
        const request: MCPRequest = {
          id: 'req-open-tab',
          method: 'open_tab',
          params: { url: 'https://example.com' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.tabId).toBe('tab-123');
        expect(mockAutomation.openNewTab).toHaveBeenCalledWith('https://example.com');
      });

      it('should switch to tab', async () => {
        const request: MCPRequest = {
          id: 'req-switch-tab',
          method: 'switch_tab',
          params: { tabId: 'tab-123' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.switchToTab).toHaveBeenCalledWith('tab-123');
      });

      it('should close tab', async () => {
        const request: MCPRequest = {
          id: 'req-close-tab',
          method: 'close_tab',
          params: { tabId: 'tab-123' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.closeTab).toHaveBeenCalledWith('tab-123');
      });

      it('should list tabs', async () => {
        const request: MCPRequest = {
          id: 'req-list-tabs',
          method: 'list_tabs',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.tabs).toBeDefined();
        expect(mockAutomation.listTabs).toHaveBeenCalled();
      });

      it('should close all tabs', async () => {
        const request: MCPRequest = {
          id: 'req-close-all-tabs',
          method: 'close_all_tabs',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.closeAllTabs).toHaveBeenCalled();
      });
    });

    describe('iFrame Handling', () => {
      it('should switch to iframe', async () => {
        const request: MCPRequest = {
          id: 'req-iframe',
          method: 'switch_to_iframe',
          params: { selector: '#myframe' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.switchToIframe).toHaveBeenCalledWith('#myframe');
      });

      it('should switch to main frame', async () => {
        const request: MCPRequest = {
          id: 'req-main-frame',
          method: 'switch_to_main_frame',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.switchToMainFrame).toHaveBeenCalled();
      });

      it('should execute in iframe', async () => {
        const request: MCPRequest = {
          id: 'req-exec-iframe',
          method: 'execute_in_iframe',
          params: {
            selector: '#myframe',
            actions: [{ type: 'click' }, { type: 'type' }],
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.actionsExecuted).toBe(2);
        expect(mockAutomation.executeInIframe).toHaveBeenCalled();
      });
    });

    describe('File Operations', () => {
      it('should upload file', async () => {
        const request: MCPRequest = {
          id: 'req-upload',
          method: 'upload_file',
          params: {
            selector: 'input[type="file"]',
            filePath: '/path/to/file.pdf',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.uploadFile).toHaveBeenCalledWith(
          'input[type="file"]',
          '/path/to/file.pdf'
        );
      });

      it('should download file', async () => {
        const request: MCPRequest = {
          id: 'req-download',
          method: 'download_file',
          params: {
            url: 'https://example.com/file.pdf',
            savePath: '/path/to/save',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.downloadPath).toBe('/path/to/download');
        expect(mockAutomation.downloadFile).toHaveBeenCalled();
      });

      it('should wait for download', async () => {
        const request: MCPRequest = {
          id: 'req-wait-download',
          method: 'wait_for_download',
          params: { timeout: 5000 },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.waitForDownload).toHaveBeenCalledWith(5000);
      });
    });

    describe('Advanced Interactions', () => {
      it('should hover over element', async () => {
        const request: MCPRequest = {
          id: 'req-hover',
          method: 'hover',
          params: { selector: '#menu', duration: 1000 },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.hover).toHaveBeenCalledWith('#menu', 1000);
      });

      it('should drag and drop', async () => {
        const request: MCPRequest = {
          id: 'req-drag',
          method: 'drag_and_drop',
          params: {
            sourceSelector: '#source',
            targetSelector: '#target',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.dragAndDrop).toHaveBeenCalledWith('#source', '#target');
      });

      it('should send keys', async () => {
        const request: MCPRequest = {
          id: 'req-keys',
          method: 'send_keys',
          params: { keys: 'Ctrl+C' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.sendKeys).toHaveBeenCalledWith('Ctrl+C');
      });

      it('should press key', async () => {
        const request: MCPRequest = {
          id: 'req-press',
          method: 'press_key',
          params: { key: 'Enter' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.pressKey).toHaveBeenCalledWith('Enter');
      });
    });

    describe('Network Monitoring', () => {
      it('should start network monitoring', async () => {
        const request: MCPRequest = {
          id: 'req-monitor-start',
          method: 'start_network_monitoring',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.monitoring).toBe(true);
        expect(mockAutomation.startNetworkMonitoring).toHaveBeenCalled();
      });

      it('should stop network monitoring', async () => {
        const request: MCPRequest = {
          id: 'req-monitor-stop',
          method: 'stop_network_monitoring',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.requestCount).toBe(0);
        expect(mockAutomation.stopNetworkMonitoring).toHaveBeenCalled();
      });

      it('should intercept request', async () => {
        const request: MCPRequest = {
          id: 'req-intercept',
          method: 'intercept_request',
          params: {
            pattern: '*.js',
            handler: 'block',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.interceptRequest).toHaveBeenCalled();
      });

      it('should block request', async () => {
        const request: MCPRequest = {
          id: 'req-block',
          method: 'block_request',
          params: { pattern: '*.ads.com' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.blockRequest).toHaveBeenCalledWith('*.ads.com');
      });
    });

    describe('Browser Profiles', () => {
      it('should save browser profile', async () => {
        const request: MCPRequest = {
          id: 'req-save-profile',
          method: 'save_browser_profile',
          params: { name: 'my-profile' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.profileName).toBe('my-profile');
        expect(mockAutomation.saveBrowserProfile).toHaveBeenCalledWith('my-profile');
      });

      it('should load browser profile', async () => {
        const request: MCPRequest = {
          id: 'req-load-profile',
          method: 'load_browser_profile',
          params: { name: 'my-profile' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.loadBrowserProfile).toHaveBeenCalledWith('my-profile');
      });

      it('should list profiles', async () => {
        const request: MCPRequest = {
          id: 'req-list-profiles',
          method: 'list_profiles',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.profiles).toEqual(['profile1', 'profile2']);
        expect(mockAutomation.listProfiles).toHaveBeenCalled();
      });
    });

    describe('Screenshot & Recording', () => {
      it('should take full page screenshot', async () => {
        const request: MCPRequest = {
          id: 'req-screenshot-full',
          method: 'take_full_page_screenshot',
          params: { path: '/path/to/screenshot.png' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.screenshotPath).toBe('/path/to/screenshot.png');
        expect(mockAutomation.takeFullPageScreenshot).toHaveBeenCalled();
      });

      it('should start video recording', async () => {
        const request: MCPRequest = {
          id: 'req-record-start',
          method: 'start_video_recording',
          params: { path: '/path/to/video.mp4' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.recording).toBe(true);
        expect(mockAutomation.startVideoRecording).toHaveBeenCalled();
      });

      it('should stop video recording', async () => {
        const request: MCPRequest = {
          id: 'req-record-stop',
          method: 'stop_video_recording',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.videoPath).toBe('/path/to/video.mp4');
        expect(mockAutomation.stopVideoRecording).toHaveBeenCalled();
      });
    });

    describe('Advanced Waiting', () => {
      it('should wait for element', async () => {
        const request: MCPRequest = {
          id: 'req-wait-elem',
          method: 'wait_for_element',
          params: {
            selector: '#loading',
            timeout: 5000,
            visible: true,
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.waitForElement).toHaveBeenCalledWith(
          '#loading',
          { timeout: 5000, visible: true }
        );
      });

      it('should wait for navigation', async () => {
        const request: MCPRequest = {
          id: 'req-wait-nav',
          method: 'wait_for_navigation',
          params: {
            timeout: 10000,
            waitUntil: 'load',
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.waitForNavigation).toHaveBeenCalledWith({
          timeout: 10000,
          waitUntil: 'load',
        });
      });

      it('should wait for function', async () => {
        const request: MCPRequest = {
          id: 'req-wait-fn',
          method: 'wait_for_function',
          params: {
            fn: 'window.loaded === true',
            timeout: 5000,
            polling: 100,
          },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(mockAutomation.waitForFunction).toHaveBeenCalled();
      });
    });

    describe('Health Check', () => {
      it('should perform health check for agent', async () => {
        const request: MCPRequest = {
          id: 'req-health',
          method: 'health_check',
          params: { agentId: 'agent-1' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.healthy).toBe(true);
        expect(response.result.stats).toBeDefined();
        expect(mockOrchestrator.getAgentStatistics).toHaveBeenCalledWith('agent-1');
      });

      it('should return unhealthy when agent status is not healthy', async () => {
        mockOrchestrator.getAgentStatistics.mockResolvedValueOnce({
          healthStatus: 'unhealthy',
        });

        const request: MCPRequest = {
          id: 'req-health',
          method: 'health_check',
          params: { agentId: 'agent-1' },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.healthy).toBe(false);
      });
    });

    describe('Context Management', () => {
      it('should save context', async () => {
        const request: MCPRequest = {
          id: 'req-save-ctx',
          method: 'save_context',
          params: { contextId: 'ctx-123', data: {} },
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.success).toBe(true);
        expect(response.result.contextId).toBe('ctx-123');
      });

      it('should get context', async () => {
        const request: MCPRequest = {
          id: 'req-get-ctx',
          method: 'get_context',
        };

        const response = await protocol.handleRequest(request);
        expect(response.result.context).toBeDefined();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should return error for unknown method', async () => {
      const request: MCPRequest = {
        id: 'req-unknown',
        method: 'unknown_method',
      };

      const response = await protocol.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601);
      expect(response.error?.message).toContain('Method not found');
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      protocol.registerRequestHandler('failing_method', errorHandler);

      const request: MCPRequest = {
        id: 'req-fail',
        method: 'failing_method',
      };

      const response = await protocol.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32603);
      expect(response.error?.message).toBe('Handler failed');
    });

    it('should include stack trace in error data', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      protocol.registerRequestHandler('error_method', errorHandler);

      const request: MCPRequest = {
        id: 'req-error',
        method: 'error_method',
      };

      const response = await protocol.handleRequest(request);
      expect(response.error?.data).toBeDefined();
      expect(typeof response.error?.data).toBe('string');
    });

    it('should handle non-Error exceptions', async () => {
      const errorHandler = jest.fn().mockRejectedValue('String error');
      protocol.registerRequestHandler('string_error_method', errorHandler);

      const request: MCPRequest = {
        id: 'req-string-error',
        method: 'string_error_method',
      };

      const response = await protocol.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe('Internal error');
    });
  });

  // ============================================================================
  // MESSAGE COMMUNICATION
  // ============================================================================

  describe('Message Communication', () => {
    it('should send request to agent', async () => {
      mockMessageBroker.request.mockResolvedValue({ success: true });

      const result = await protocol.sendRequest('agent-1', 'test_method', { data: 'test' });
      expect(result).toEqual({ success: true });
      expect(mockMessageBroker.request).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({
          method: 'test_method',
          params: { data: 'test' },
        })
      );
    });

    it('should send notification to agent', async () => {
      await protocol.sendNotification('agent-1', 'notify_method', { alert: 'test' });
      expect(mockMessageBroker.sendCommand).toHaveBeenCalledWith(
        'agent-1',
        'notify_method',
        { alert: 'test' }
      );
    });

    it('should broadcast notification to all agents', async () => {
      await protocol.broadcastNotification('broadcast_method', { data: 'all' });
      expect(mockMessageBroker.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'command',
          agentId: 'all',
          payload: {
            method: 'broadcast_method',
            params: { data: 'all' },
          },
        })
      );
    });
  });

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  describe('Workflow Execution', () => {
    it('should execute workflow via convenience method', async () => {
      mockOrchestrator.createTask.mockResolvedValue('task-456');

      const result = await protocol.executeWorkflow(
        'agent-2',
        'workflow-789',
        [{ action: 'click' }],
        'user-123'
      );

      expect(result.result).toBeDefined();
      expect(result.result.taskId).toBe('task-456');
      expect(mockOrchestrator.createTask).toHaveBeenCalled();
    });

    it('should execute workflow without userId', async () => {
      const result = await protocol.executeWorkflow(
        'agent-2',
        'workflow-789',
        [{ action: 'navigate' }]
      );

      expect(result.result).toBeDefined();
    });
  });

  // ============================================================================
  // CHROME EXTENSION CONFIGURATION
  // ============================================================================

  describe('Chrome Extension Configuration', () => {
    it('should return configuration for Chrome extension', () => {
      const config = protocol.getChromeExtensionConfig();
      
      expect(config).toHaveProperty('mcpEndpoint');
      expect(config).toHaveProperty('supportedMethods');
      expect(config).toHaveProperty('supportedNotifications');
      expect(config).toHaveProperty('agents');
    });

    it('should include all supported methods', () => {
      const config = protocol.getChromeExtensionConfig();
      
      expect(Array.isArray(config.supportedMethods)).toBe(true);
      expect(config.supportedMethods.length).toBeGreaterThan(0);
      expect(config.supportedMethods).toContain('execute_workflow');
      expect(config.supportedMethods).toContain('get_task_status');
    });

    it('should include 21 agents', () => {
      const config = protocol.getChromeExtensionConfig();
      
      expect(config.agents.total).toBe(21);
      expect(config.agents.available).toHaveLength(21);
    });

    it('should use environment variable for MCP endpoint', () => {
      const originalEnv = process.env.MCP_ENDPOINT;
      process.env.MCP_ENDPOINT = 'ws://custom:9000/mcp';
      
      const config = protocol.getChromeExtensionConfig();
      expect(config.mcpEndpoint).toBe('ws://custom:9000/mcp');
      
      process.env.MCP_ENDPOINT = originalEnv;
    });

    it('should use default endpoint when env var not set', () => {
      const originalEnv = process.env.MCP_ENDPOINT;
      delete process.env.MCP_ENDPOINT;
      
      const config = protocol.getChromeExtensionConfig();
      expect(config.mcpEndpoint).toBe('ws://localhost:7042/mcp');
      
      process.env.MCP_ENDPOINT = originalEnv;
    });
  });

  // ============================================================================
  // SINGLETON PATTERN
  // ============================================================================

  describe('Singleton Pattern', () => {
    it('should return singleton instance', () => {
      const instance1 = getMCPProtocol();
      const instance2 = getMCPProtocol();
      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      const callCount = (getMessageBroker as jest.Mock).mock.calls.length;
      getMCPProtocol();
      getMCPProtocol();
      getMCPProtocol();
      // Should not increase significantly
      expect((getMessageBroker as jest.Mock).mock.calls.length).toBeLessThanOrEqual(callCount + 1);
    });
  });
});
