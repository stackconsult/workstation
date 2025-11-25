import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Code Quality
 * Analyze code quality and enforce standards
 */
class CodeQualityMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'code-quality-mcp',
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
        agent: 'agent-07-code-quality-mcp',
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
        name: 'lint_code',
        description: 'Run linter on code',
        inputSchema: {
          type: 'object',
          properties: {
          filePath: {
            "type": "string",
            "description": "Path to file or directory"
          },
          fix: {
            "type": "boolean",
            "description": "Auto-fix issues"
          }
          },
          required: ["filePath"]
        }
      },
      {
        name: 'check_types',
        description: 'Run TypeScript type checking',
        inputSchema: {
          type: 'object',
          properties: {
          projectPath: {
            "type": "string",
            "description": "Project root path"
          }
          },
          required: ["projectPath"]
        }
      },
      {
        name: 'analyze_complexity',
        description: 'Analyze code complexity',
        inputSchema: {
          type: 'object',
          properties: {
          filePath: {
            "type": "string",
            "description": "Path to file"
          }
          },
          required: ["filePath"]
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
        case 'lint_code':
          return await this.lint_code(args);
        case 'check_types':
          return await this.check_types(args);
        case 'analyze_complexity':
          return await this.analyze_complexity(args);
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
  private async lint_code(args: any): Promise<any> {
    // TODO: Implement lint_code
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'lint_code executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async check_types(args: any): Promise<any> {
    // TODO: Implement check_types
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'check_types executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async analyze_complexity(args: any): Promise<any> {
    // TODO: Implement analyze_complexity
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'analyze_complexity executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Quality MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new CodeQualityMCP();

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
