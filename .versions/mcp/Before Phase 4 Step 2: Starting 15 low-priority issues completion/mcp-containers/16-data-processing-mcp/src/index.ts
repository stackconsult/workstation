import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Data Processor
 * Process, transform, and analyze data
 */
class DataProcessorMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'data-processing-mcp',
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
        agent: 'agent-16-data-processing-mcp',
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
        name: 'transform_data',
        description: 'Transform data structure',
        inputSchema: {
          type: 'object',
          properties: {
          data: {
            "type": "object",
            "description": "Input data"
          },
          transformation: {
            "type": "string",
            "description": "Transformation type"
          }
          },
          required: ["data","transformation"]
        }
      },
      {
        name: 'export_csv',
        description: 'Export data to CSV',
        inputSchema: {
          type: 'object',
          properties: {
          data: {
            "type": "array",
            "description": "Data array"
          },
          filename: {
            "type": "string",
            "description": "Output filename"
          }
          },
          required: ["data","filename"]
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
        case 'transform_data':
          return await this.transform_data(args);
        case 'export_csv':
          return await this.export_csv(args);
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
  private async transform_data(args: any): Promise<any> {
    // TODO: Implement transform_data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'transform_data executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async export_csv(args: any): Promise<any> {
    // TODO: Implement export_csv
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'export_csv executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Data Processor MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new DataProcessorMCP();

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
