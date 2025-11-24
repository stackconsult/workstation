import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Error Tracker
 * Aggregate and analyze errors across system
 */
class ErrorTrackerMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'error-tracker-mcp',
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
        agent: 'agent-09-error-tracker-mcp',
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
        name: 'log_error',
        description: 'Log a structured error',
        inputSchema: {
          type: 'object',
          properties: {
          level: {
            "type": "string",
            "description": "Error level"
          },
          message: {
            "type": "string",
            "description": "Error message"
          },
          context: {
            "type": "object",
            "description": "Error context"
          }
          },
          required: ["level","message"]
        }
      },
      {
        name: 'query_errors',
        description: 'Query error logs',
        inputSchema: {
          type: 'object',
          properties: {
          startDate: {
            "type": "string",
            "description": "Start date"
          },
          endDate: {
            "type": "string",
            "description": "End date"
          },
          level: {
            "type": "string",
            "description": "Filter by level"
          }
          },
          required: []
        }
      },
      {
        name: 'get_error_stats',
        description: 'Get error statistics',
        inputSchema: {
          type: 'object',
          properties: {
          period: {
            "type": "string",
            "description": "Time period (day, week, month)"
          }
          },
          required: ["period"]
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
        case 'log_error':
          return await this.log_error(args);
        case 'query_errors':
          return await this.query_errors(args);
        case 'get_error_stats':
          return await this.get_error_stats(args);
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
  private async log_error(args: any): Promise<any> {
    // TODO: Implement log_error
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'log_error executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async query_errors(args: any): Promise<any> {
    // TODO: Implement query_errors
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'query_errors executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async get_error_stats(args: any): Promise<any> {
    // TODO: Implement get_error_stats
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'get_error_stats executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Error Tracker MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new ErrorTrackerMCP();

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
