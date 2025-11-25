/**
 * Base MCP Server Template
 * Use this as template for all 20 agent MCP servers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';
import * as http from 'http';

class BaseMCPServer {
  private server: Server;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(name: string, version: string = '1.0.0') {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHealthCheck();
  }

  private setupTools() {
    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await this.handleTool(name, args);
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

  private setupHealthCheck() {
    // Simple HTTP server for health checks
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    healthServer.listen(3000, () => {
      console.error('Health check server running on port 3000');
    });
  }

  protected async ensureBrowser(): Promise<Page> {
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

  // Override these methods in specific MCP implementations
  protected getTools(): any[] {
    return [
      {
        name: 'example_tool',
        description: 'Example tool',
        inputSchema: {
          type: 'object',
          properties: {
            param: {
              type: 'string',
              description: 'Example parameter',
            },
          },
          required: ['param'],
        },
      },
    ];
  }

  protected async handleTool(name: string, args: any): Promise<any> {
    throw new Error(`Tool not implemented: ${name}`);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server running on stdio');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down...');
  process.exit(0);
});

export default BaseMCPServer;
