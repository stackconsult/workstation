import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Integration Hub
 * Connect to external APIs and services
 */
class IntegrationHubMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'integration-mcp',
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
        agent: 'agent-12-integration-mcp',
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
        name: 'call_api',
        description: 'Make HTTP API request',
        inputSchema: {
          type: 'object',
          properties: {
          method: {
            "type": "string",
            "description": "HTTP method"
          },
          url: {
            "type": "string",
            "description": "API endpoint"
          },
          headers: {
            "type": "object",
            "description": "Request headers"
          },
          body: {
            "type": "object",
            "description": "Request body"
          }
          },
          required: ["method","url"]
        }
      },
      {
        name: 'send_webhook',
        description: 'Send webhook event',
        inputSchema: {
          type: 'object',
          properties: {
          webhookUrl: {
            "type": "string",
            "description": "Webhook URL"
          },
          payload: {
            "type": "object",
            "description": "Event payload"
          }
          },
          required: ["webhookUrl","payload"]
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
        case 'call_api':
          return await this.call_api(args);
        case 'send_webhook':
          return await this.send_webhook(args);
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


  // Tool implementation methods
  private async call_api(args: any): Promise<any> {
    // TODO: Implement call_api
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'call_api executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async send_webhook(args: any): Promise<any> {
    // TODO: Implement send_webhook
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'send_webhook executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Integration Hub MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new IntegrationHubMCP();

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
