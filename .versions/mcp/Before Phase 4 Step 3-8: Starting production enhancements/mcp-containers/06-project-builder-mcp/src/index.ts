import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Project Builder
 * Generate project structures and boilerplate code
 */
class ProjectBuilderMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'project-builder-mcp',
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
        agent: 'agent-06-project-builder-mcp',
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
        name: 'scaffold_project',
        description: 'Create a new project structure',
        inputSchema: {
          type: 'object',
          properties: {
          projectType: {
            "type": "string",
            "description": "Type of project (node, react, etc)"
          },
          projectName: {
            "type": "string",
            "description": "Project name"
          },
          outputDir: {
            "type": "string",
            "description": "Output directory"
          }
          },
          required: ["projectType","projectName","outputDir"]
        }
      },
      {
        name: 'generate_component',
        description: 'Generate a code component',
        inputSchema: {
          type: 'object',
          properties: {
          componentType: {
            "type": "string",
            "description": "Component type"
          },
          componentName: {
            "type": "string",
            "description": "Component name"
          }
          },
          required: ["componentType","componentName"]
        }
      },
      {
        name: 'add_dependency',
        description: 'Add npm dependency to project',
        inputSchema: {
          type: 'object',
          properties: {
          packageName: {
            "type": "string",
            "description": "Package name"
          },
          version: {
            "type": "string",
            "description": "Package version (optional)"
          }
          },
          required: ["packageName"]
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
        case 'scaffold_project':
          return await this.scaffold_project(args);
        case 'generate_component':
          return await this.generate_component(args);
        case 'add_dependency':
          return await this.add_dependency(args);
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
  private async scaffold_project(args: any): Promise<any> {
    // TODO: Implement scaffold_project
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'scaffold_project executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async generate_component(args: any): Promise<any> {
    // TODO: Implement generate_component
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'generate_component executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async add_dependency(args: any): Promise<any> {
    // TODO: Implement add_dependency
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'add_dependency executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Project Builder MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new ProjectBuilderMCP();

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
