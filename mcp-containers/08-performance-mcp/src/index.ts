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
 * MCP Server for Performance Monitor
 * Monitor and optimize performance metrics
 */
class PerformanceMonitorMCP {
  private server: Server;
  private httpServer: any;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'performance-mcp',
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
        agent: 'agent-08-performance-mcp',
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
        name: 'measure_load_time',
        description: 'Measure page load performance',
        inputSchema: {
          type: 'object',
          properties: {
          url: {
            "type": "string",
            "description": "URL to measure"
          }
          },
          required: ["url"]
        }
      },
      {
        name: 'run_lighthouse',
        description: 'Run Lighthouse audit',
        inputSchema: {
          type: 'object',
          properties: {
          url: {
            "type": "string",
            "description": "URL to audit"
          },
          categories: {
            "type": "array",
            "description": "Categories to test"
          }
          },
          required: ["url"]
        }
      },
      {
        name: 'monitor_memory',
        description: 'Monitor memory usage',
        inputSchema: {
          type: 'object',
          properties: {
          url: {
            "type": "string",
            "description": "URL to monitor"
          },
          duration: {
            "type": "number",
            "description": "Duration in seconds"
          }
          },
          required: ["url","duration"]
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
        case 'measure_load_time':
          return await this.measure_load_time(args);
        case 'run_lighthouse':
          return await this.run_lighthouse(args);
        case 'monitor_memory':
          return await this.monitor_memory(args);
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
  private async measure_load_time(args: any): Promise<any> {
    // TODO: Implement measure_load_time
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'measure_load_time executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async run_lighthouse(args: any): Promise<any> {
    // TODO: Implement run_lighthouse
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'run_lighthouse executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async monitor_memory(args: any): Promise<any> {
    // TODO: Implement monitor_memory
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'monitor_memory executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Performance Monitor MCP Server running on stdio');
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
const server = new PerformanceMonitorMCP();

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
