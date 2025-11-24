import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Deployment Manager
 * Manage deployments and releases
 */
class DeploymentManagerMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'deployment-mcp',
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
        agent: 'agent-19-deployment-mcp',
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
        name: 'deploy_container',
        description: 'Deploy Docker container',
        inputSchema: {
          type: 'object',
          properties: {
          imageName: {
            "type": "string",
            "description": "Docker image name"
          },
          tag: {
            "type": "string",
            "description": "Image tag"
          }
          },
          required: ["imageName","tag"]
        }
      },
      {
        name: 'rollback_deployment',
        description: 'Rollback to previous version',
        inputSchema: {
          type: 'object',
          properties: {
          deploymentId: {
            "type": "string",
            "description": "Deployment ID"
          }
          },
          required: ["deploymentId"]
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
        case 'deploy_container':
          return await this.deploy_container(args);
        case 'rollback_deployment':
          return await this.rollback_deployment(args);
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
  private async deploy_container(args: any): Promise<any> {
    // TODO: Implement deploy_container
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'deploy_container executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async rollback_deployment(args: any): Promise<any> {
    // TODO: Implement rollback_deployment
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'rollback_deployment executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Deployment Manager MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new DeploymentManagerMCP();

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
