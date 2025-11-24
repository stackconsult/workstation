import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Docs Auditor
 * Audit and improve documentation
 */
class DocsAuditorMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'docs-auditor-mcp',
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
        agent: 'agent-13-docs-auditor-mcp',
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
        name: 'check_completeness',
        description: 'Check documentation coverage',
        inputSchema: {
          type: 'object',
          properties: {
          projectPath: {
            "type": "string",
            "description": "Project path"
          }
          },
          required: ["projectPath"]
        }
      },
      {
        name: 'validate_links',
        description: 'Validate documentation links',
        inputSchema: {
          type: 'object',
          properties: {
          docsPath: {
            "type": "string",
            "description": "Path to docs"
          }
          },
          required: ["docsPath"]
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
        case 'check_completeness':
          return await this.check_completeness(args);
        case 'validate_links':
          return await this.validate_links(args);
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
  private async check_completeness(args: any): Promise<any> {
    // TODO: Implement check_completeness
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'check_completeness executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async validate_links(args: any): Promise<any> {
    // TODO: Implement validate_links
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'validate_links executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Docs Auditor MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new DocsAuditorMCP();

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
