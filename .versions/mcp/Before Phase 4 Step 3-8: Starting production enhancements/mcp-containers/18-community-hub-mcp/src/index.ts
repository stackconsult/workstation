import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Community Hub
 * Share workflows and collaborate
 */
class CommunityHubMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'community-hub-mcp',
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
        agent: 'agent-18-community-hub-mcp',
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
        name: 'share_workflow',
        description: 'Share workflow configuration',
        inputSchema: {
          type: 'object',
          properties: {
          workflowId: {
            "type": "string",
            "description": "Workflow ID"
          },
          visibility: {
            "type": "string",
            "description": "Public or private"
          }
          },
          required: ["workflowId"]
        }
      },
      {
        name: 'search_workflows',
        description: 'Search community workflows',
        inputSchema: {
          type: 'object',
          properties: {
          query: {
            "type": "string",
            "description": "Search query"
          }
          },
          required: ["query"]
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
        case 'share_workflow':
          return await this.share_workflow(args);
        case 'search_workflows':
          return await this.search_workflows(args);
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
  private async share_workflow(args: any): Promise<any> {
    // TODO: Implement share_workflow
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'share_workflow executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async search_workflows(args: any): Promise<any> {
    // TODO: Implement search_workflows
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'search_workflows executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Community Hub MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new CommunityHubMCP();

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
