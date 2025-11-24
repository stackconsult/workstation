import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for API Integrator
 * Build and test API integrations
 */
class APIIntegratorMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'api-integration-mcp',
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
        agent: 'agent-15-api-integration-mcp',
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
        name: 'test_endpoint',
        description: 'Test API endpoint',
        inputSchema: {
          type: 'object',
          properties: {
          endpoint: {
            "type": "string",
            "description": "API endpoint"
          },
          method: {
            "type": "string",
            "description": "HTTP method"
          }
          },
          required: ["endpoint","method"]
        }
      },
      {
        name: 'generate_client',
        description: 'Generate API client code',
        inputSchema: {
          type: 'object',
          properties: {
          spec: {
            "type": "object",
            "description": "OpenAPI/Swagger spec"
          }
          },
          required: ["spec"]
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
        case 'test_endpoint':
          return await this.test_endpoint(args);
        case 'generate_client':
          return await this.generate_client(args);
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
  private async test_endpoint(args: any): Promise<any> {
    // TODO: Implement test_endpoint
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'test_endpoint executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async generate_client(args: any): Promise<any> {
    // TODO: Implement generate_client
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'generate_client executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('API Integrator MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new APIIntegratorMCP();

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
