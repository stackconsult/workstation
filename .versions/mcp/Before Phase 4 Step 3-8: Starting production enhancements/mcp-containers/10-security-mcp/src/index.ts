import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';

/**
 * MCP Server for Security Scanner
 * Scan for security vulnerabilities
 */
class SecurityScannerMCP {
  private server: Server;
  private httpServer: any;


  constructor() {
    this.server = new Server(
      {
        name: 'security-mcp',
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
        agent: 'agent-10-security-mcp',
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
        name: 'scan_dependencies',
        description: 'Scan npm dependencies for vulnerabilities',
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
        name: 'check_secrets',
        description: 'Check for exposed secrets',
        inputSchema: {
          type: 'object',
          properties: {
          path: {
            "type": "string",
            "description": "Path to scan"
          }
          },
          required: ["path"]
        }
      },
      {
        name: 'analyze_headers',
        description: 'Analyze security headers',
        inputSchema: {
          type: 'object',
          properties: {
          url: {
            "type": "string",
            "description": "URL to analyze"
          }
          },
          required: ["url"]
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
        case 'scan_dependencies':
          return await this.scan_dependencies(args);
        case 'check_secrets':
          return await this.check_secrets(args);
        case 'analyze_headers':
          return await this.analyze_headers(args);
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
  private async scan_dependencies(args: any): Promise<any> {
    // TODO: Implement scan_dependencies
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'scan_dependencies executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async check_secrets(args: any): Promise<any> {
    // TODO: Implement check_secrets
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'check_secrets executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  private async analyze_headers(args: any): Promise<any> {
    // TODO: Implement analyze_headers
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'analyze_headers executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Security Scanner MCP Server running on stdio');
  }

  async cleanup() {

    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new SecurityScannerMCP();

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
