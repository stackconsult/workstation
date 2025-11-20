/**
 * MCP (Model Context Protocol) Routes
 * Implements MCP endpoints for GitHub Copilot and AI agent integration
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth/jwt';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Type definitions for MCP responses
 */
interface ToolExecutionResult {
  success: boolean;
  message?: string;
  endpoint?: string;
  parameters?: Record<string, unknown>;
  tool?: string;
  note?: string;
}

interface ResourceData {
  message?: string;
  endpoint?: string;
  note?: string;
  tool?: string;
  resource?: string;
}

interface WorkflowTask {
  name: string;
  agent_type: string;
  action: string;
  parameters: Record<string, unknown>;
}

interface WorkflowDefinition {
  name: string;
  description: string;
  tasks: WorkflowTask[];
  error?: string;
  prompt?: string;
}

interface WorkflowDefinitionError {
  error: string;
  prompt: string;
}

/**
 * Tool definitions for MCP
 * These match the capabilities defined in server.json
 */
const mcpTools = [
  {
    name: 'browser_navigate',
    description: 'Navigate browser to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to'
        },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          description: 'When to consider navigation successful'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'browser_click',
    description: 'Click an element on the page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to click'
        },
        waitForSelector: {
          type: 'boolean',
          description: 'Wait for selector to be visible before clicking'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser_type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of input element'
        },
        text: {
          type: 'string',
          description: 'Text to type'
        },
        delay: {
          type: 'number',
          description: 'Delay between keystrokes in milliseconds'
        }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the page',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: {
          type: 'boolean',
          description: 'Capture full page or just viewport'
        },
        selector: {
          type: 'string',
          description: 'Optional selector to screenshot specific element'
        }
      }
    }
  },
  {
    name: 'browser_get_text',
    description: 'Extract text content from an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser_get_content',
    description: 'Get full HTML content of the page',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the browser context',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'JavaScript code to execute'
        }
      },
      required: ['script']
    }
  },
  {
    name: 'workflow_create',
    description: 'Create a multi-step browser automation workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Workflow name'
        },
        description: {
          type: 'string',
          description: 'Workflow description'
        },
        tasks: {
          type: 'array',
          description: 'Array of tasks to execute',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              agent_type: { type: 'string', enum: ['browser'] },
              action: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        }
      },
      required: ['name', 'tasks']
    }
  },
  {
    name: 'workflow_execute',
    description: 'Execute a workflow by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID to execute'
        },
        parameters: {
          type: 'object',
          description: 'Runtime parameters for workflow'
        }
      },
      required: ['workflowId']
    }
  },
  {
    name: 'auth_get_token',
    description: 'Get JWT authentication token',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier'
        },
        role: {
          type: 'string',
          description: 'User role for authorization'
        }
      },
      required: ['userId']
    }
  }
];

/**
 * Resource definitions for MCP
 */
const mcpResources = [
  {
    name: 'workflows',
    description: 'Access to saved workflows',
    mimeType: 'application/json',
    uri: 'mcp://workstation/resources/workflows'
  },
  {
    name: 'screenshots',
    description: 'Access to captured screenshots',
    mimeType: 'image/png',
    uri: 'mcp://workstation/resources/screenshots'
  },
  {
    name: 'page_content',
    description: 'Access to extracted page content',
    mimeType: 'text/html',
    uri: 'mcp://workstation/resources/page_content'
  }
];

/**
 * Prompt definitions for MCP
 */
const mcpPrompts = [
  {
    name: 'scrape_website',
    description: 'Navigate to a website and extract structured data',
    arguments: [
      {
        name: 'url',
        description: 'Website URL to scrape',
        required: true
      },
      {
        name: 'selectors',
        description: 'CSS selectors for data extraction',
        required: true
      }
    ]
  },
  {
    name: 'fill_form',
    description: 'Automate form filling and submission',
    arguments: [
      {
        name: 'url',
        description: 'Form URL',
        required: true
      },
      {
        name: 'fields',
        description: 'Form fields and values',
        required: true
      }
    ]
  },
  {
    name: 'monitor_page',
    description: 'Monitor a page for changes',
    arguments: [
      {
        name: 'url',
        description: 'Page URL to monitor',
        required: true
      },
      {
        name: 'selector',
        description: 'Element selector to watch',
        required: true
      },
      {
        name: 'interval',
        description: 'Check interval in seconds',
        required: false
      }
    ]
  }
];

/**
 * GET /api/v2/mcp/tools
 * List all available MCP tools
 */
router.get('/mcp/tools', authenticateToken, (req: Request, res: Response) => {
  logger.info('MCP: Listing tools');
  res.json({
    tools: mcpTools
  });
});

/**
 * POST /api/v2/mcp/tools/:toolName
 * Execute a specific MCP tool
 */
router.post('/mcp/tools/:toolName', authenticateToken, async (req: Request, res: Response) => {
  const { toolName } = req.params;
  const parameters = req.body;
  const authenticatedReq = req as AuthenticatedRequest;

  logger.info('MCP: Tool execution requested', { 
    tool: toolName, 
    user: authenticatedReq.user?.userId 
  });

  // Find the tool definition
  const tool = mcpTools.find(t => t.name === toolName);
  if (!tool) {
    return res.status(404).json({
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool '${toolName}' not found`,
        availableTools: mcpTools.map(t => t.name)
      }
    });
  }

  try {
    // Tool execution would integrate with existing automation routes
    // For now, return a success response indicating the tool call is proxied
    // to the appropriate automation endpoint
    
    // Map MCP tool calls to existing automation endpoints
    let result: ToolExecutionResult;
    
    switch (toolName) {
      case 'workflow_create':
        // Proxy to POST /api/v2/workflows
        logger.info('MCP: Proxying to workflow creation endpoint');
        result = {
          success: true,
          message: 'Use POST /api/v2/workflows endpoint for workflow creation',
          endpoint: '/api/v2/workflows',
          parameters
        };
        break;
        
      case 'workflow_execute':
        // Proxy to POST /api/v2/workflows/{id}/execute
        logger.info('MCP: Proxying to workflow execution endpoint');
        result = {
          success: true,
          message: 'Use POST /api/v2/workflows/{workflowId}/execute endpoint',
          endpoint: `/api/v2/workflows/${parameters.workflowId}/execute`,
          parameters: parameters.parameters
        };
        break;
        
      case 'auth_get_token':
        // Proxy to POST /auth/token
        logger.info('MCP: Proxying to auth token endpoint');
        result = {
          success: true,
          message: 'Use POST /auth/token or GET /auth/demo-token endpoint',
          endpoint: '/auth/token',
          parameters
        };
        break;
        
      default:
        // Browser tools proxy to automation endpoints
        logger.info('MCP: Browser tool call', { tool: toolName });
        result = {
          success: true,
          message: `Tool '${toolName}' will execute through automation engine`,
          tool: toolName,
          parameters,
          note: 'Integrate with POST /api/v2/tasks endpoint for browser automation'
        };
    }

    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('MCP: Tool execution failed', { 
      tool: toolName, 
      error: (error as Error).message 
    });
    
    res.status(500).json({
      error: {
        code: 'EXECUTION_ERROR',
        message: `Tool execution failed: ${(error as Error).message}`,
        tool: toolName
      }
    });
  }
});

/**
 * GET /api/v2/mcp/resources
 * List all available MCP resources
 */
router.get('/mcp/resources', authenticateToken, (req: Request, res: Response) => {
  logger.info('MCP: Listing resources');
  res.json({
    resources: mcpResources
  });
});

/**
 * GET /api/v2/mcp/resources/:resourceName
 * Access a specific MCP resource
 */
router.get('/mcp/resources/:resourceName', authenticateToken, async (req: Request, res: Response) => {
  const { resourceName } = req.params;
  const authenticatedReq = req as AuthenticatedRequest;

  logger.info('MCP: Resource access requested', { 
    resource: resourceName, 
    user: authenticatedReq.user?.userId 
  });

  // Find the resource definition
  const resource = mcpResources.find(r => r.name === resourceName);
  if (!resource) {
    return res.status(404).json({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Resource '${resourceName}' not found`,
        availableResources: mcpResources.map(r => r.name)
      }
    });
  }

  try {
    // Resource access would integrate with existing data retrieval
    let data: ResourceData;
    
    switch (resourceName) {
      case 'workflows':
        // Proxy to GET /api/v2/workflows
        logger.info('MCP: Proxying to workflows endpoint');
        data = {
          message: 'Use GET /api/v2/workflows endpoint',
          endpoint: '/api/v2/workflows'
        };
        break;
        
      case 'screenshots':
        logger.info('MCP: Screenshots resource accessed');
        data = {
          message: 'Screenshot data available through workflow results',
          note: 'Screenshots are returned as base64-encoded PNG data in workflow execution results'
        };
        break;
        
      case 'page_content':
        logger.info('MCP: Page content resource accessed');
        data = {
          message: 'Page content available through browser_get_content tool',
          tool: 'browser_get_content'
        };
        break;
        
      default:
        data = {
          message: 'Resource not implemented',
          resource: resourceName
        };
    }

    res.json({
      resource: resourceName,
      mimeType: resource.mimeType,
      data
    });
    
  } catch (error) {
    logger.error('MCP: Resource access failed', { 
      resource: resourceName, 
      error: (error as Error).message 
    });
    
    res.status(500).json({
      error: {
        code: 'RESOURCE_ERROR',
        message: `Resource access failed: ${(error as Error).message}`,
        resource: resourceName
      }
    });
  }
});

/**
 * GET /api/v2/mcp/prompts
 * List all available MCP prompts
 */
router.get('/mcp/prompts', authenticateToken, (req: Request, res: Response) => {
  logger.info('MCP: Listing prompts');
  res.json({
    prompts: mcpPrompts
  });
});

/**
 * POST /api/v2/mcp/prompts/:promptName
 * Execute a specific MCP prompt
 */
router.post('/mcp/prompts/:promptName', authenticateToken, async (req: Request, res: Response) => {
  const { promptName } = req.params;
  const arguments_ = req.body;
  const authenticatedReq = req as AuthenticatedRequest;

  logger.info('MCP: Prompt execution requested', { 
    prompt: promptName, 
    user: authenticatedReq.user?.userId 
  });

  // Find the prompt definition
  const prompt = mcpPrompts.find(p => p.name === promptName);
  if (!prompt) {
    return res.status(404).json({
      error: {
        code: 'PROMPT_NOT_FOUND',
        message: `Prompt '${promptName}' not found`,
        availablePrompts: mcpPrompts.map(p => p.name)
      }
    });
  }

  // Validate required arguments
  const missingArgs = prompt.arguments
    .filter(arg => arg.required && !arguments_[arg.name])
    .map(arg => arg.name);

  if (missingArgs.length > 0) {
    return res.status(400).json({
      error: {
        code: 'MISSING_ARGUMENTS',
        message: 'Required arguments missing',
        missing: missingArgs
      }
    });
  }

  try {
    // Prompt execution creates a workflow based on the prompt template
    let workflowDefinition: WorkflowDefinition | WorkflowDefinitionError;
    
    switch (promptName) {
      case 'scrape_website':
        logger.info('MCP: Creating scrape_website workflow');
        workflowDefinition = {
          name: `Scrape ${arguments_.url}`,
          description: 'Auto-generated from scrape_website prompt',
          tasks: [
            {
              name: 'navigate',
              agent_type: 'browser',
              action: 'navigate',
              parameters: { url: arguments_.url }
            },
            ...(arguments_.selectors && typeof arguments_.selectors === 'object'
              ? Object.entries(arguments_.selectors).map(([key, selector]) => ({
                  name: `extract_${key}`,
                  agent_type: 'browser',
                  action: 'getText',
                  parameters: { selector }
                }))
              : [])
          ]
        };
        break;
        
      case 'fill_form':
        logger.info('MCP: Creating fill_form workflow');
        workflowDefinition = {
          name: `Fill form at ${arguments_.url}`,
          description: 'Auto-generated from fill_form prompt',
          tasks: [
            {
              name: 'navigate',
              agent_type: 'browser',
              action: 'navigate',
              parameters: { url: arguments_.url }
            },
            ...(arguments_.fields && typeof arguments_.fields === 'object'
              ? Object.entries(arguments_.fields).map(([selector, value]) => ({
                  name: `fill_${selector.replace(/[^a-z0-9]/gi, '_')}`,
                  agent_type: 'browser',
                  action: 'type',
                  parameters: { selector, text: value }
                }))
              : []),
            {
              name: 'submit',
              agent_type: 'browser',
              action: 'click',
              parameters: { selector: 'button[type="submit"]' }
            }
          ]
        };
        break;
        
      case 'monitor_page':
        logger.info('MCP: Creating monitor_page workflow');
        workflowDefinition = {
          name: `Monitor ${arguments_.url}`,
          description: 'Auto-generated from monitor_page prompt',
          tasks: [
            {
              name: 'navigate',
              agent_type: 'browser',
              action: 'navigate',
              parameters: { url: arguments_.url }
            },
            {
              name: 'extract_content',
              agent_type: 'browser',
              action: 'getText',
              parameters: { selector: arguments_.selector }
            },
            {
              name: 'screenshot',
              agent_type: 'browser',
              action: 'screenshot',
              parameters: { fullPage: true }
            }
          ]
        };
        break;
        
      default:
        workflowDefinition = {
          error: 'Prompt not implemented',
          prompt: promptName
        };
    }

    res.json({
      success: true,
      prompt: promptName,
      workflowDefinition,
      message: 'Create this workflow using POST /api/v2/workflows endpoint',
      endpoint: '/api/v2/workflows'
    });
    
  } catch (error) {
    logger.error('MCP: Prompt execution failed', { 
      prompt: promptName, 
      error: (error as Error).message 
    });
    
    res.status(500).json({
      error: {
        code: 'PROMPT_ERROR',
        message: `Prompt execution failed: ${(error as Error).message}`,
        prompt: promptName
      }
    });
  }
});

/**
 * GET /api/v2/mcp/server-info
 * Get MCP server information
 */
router.get('/mcp/server-info', (req: Request, res: Response) => {
  logger.info('MCP: Server info requested');
  
  res.json({
    name: 'workstation-mcp-server',
    version: '1.0.0',
    description: 'Model Context Protocol server for Workstation browser automation',
    capabilities: {
      tools: mcpTools.length,
      resources: mcpResources.length,
      prompts: mcpPrompts.length
    },
    documentation: {
      registry: '/.mcp/README.md',
      api: '/.mcp/specs/API_SPEC.md',
      publishing: '/.mcp/guides/PUBLISHING.md',
      usage: '/.mcp/guides/API_USAGE.md'
    },
    endpoints: {
      tools: '/api/v2/mcp/tools',
      resources: '/api/v2/mcp/resources',
      prompts: '/api/v2/mcp/prompts',
      auth: '/auth/demo-token'
    }
  });
});

export default router;
