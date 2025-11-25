import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';
import express from 'express';

/**
 * MCP Server for Advanced Automation
 * Handle complex multi-page automation
 */
class AdvancedAutomationMCP {
  private server: Server;
  private httpServer: any;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'advanced-automation-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHttpServer();
  }

  private setupHttpServer() {
    const app = express();
    
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        agent: 'agent-14-advanced-automation-mcp',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
    
    this.httpServer = app.listen(3000, () => {
      console.error('Health check server running on port 3000');
    });
  }

  private setupTools() {
    // Define available tools
    const tools: Tool[] = [
      {
        name: 'create_bot',
        description: 'Define automation bot',
        inputSchema: {
          type: 'object',
          properties: {
          name: {
            "type": "string",
            "description": "Bot name"
          },
          actions: {
            "type": "array",
            "description": "Bot actions"
          }
          },
          required: ["name","actions"]
        }
      },
      {
        name: 'schedule_task',
        description: 'Schedule recurring task',
        inputSchema: {
          type: 'object',
          properties: {
          taskId: {
            "type": "string",
            "description": "Task ID"
          },
          schedule: {
            "type": "string",
            "description": "Cron expression"
          }
          },
          required: ["taskId","schedule"]
        }
      }
    ];

    // Register tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    // Register tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
        case 'create_bot':
          return await this.create_bot(args);
        case 'schedule_task':
          return await this.schedule_task(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async ensureBrowser(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      });
      const context = await this.browser.newContext();
      this.page = await context.newPage();
    }
    return this.page!;
  }

  // Tool implementation methods
  private async create_bot(args: any): Promise<any> {
    // TODO: Implement create_bot
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'create_bot executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async schedule_task(args: any): Promise<any> {
    // TODO: Implement schedule_task
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'schedule_task executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Advanced Automation MCP Server running on stdio');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new AdvancedAutomationMCP();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  await server.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down...');
  await server.cleanup();
  process.exit(0);
});

// Start server
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
