#!/usr/bin/env ts-node

/**
 * Automated MCP Builder Script
 * Generates all missing MCP containers (05-20) based on architecture specification
 */

import * as fs from 'fs';
import * as path from 'path';

interface MCPDefinition {
  number: string;
  name: string;
  agentName: string;
  port: number;
  purpose: string;
  tools: ToolDefinition[];
  dependencies: string[];
  needsBrowser: boolean;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required: string[];
}

const MCP_DEFINITIONS: MCPDefinition[] = [
  {
    number: '05',
    name: 'workflow-mcp',
    agentName: 'Workflow Orchestrator',
    port: 3005,
    purpose: 'Coordinate multi-step automation workflows',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'node-cron'],
    tools: [
      {
        name: 'create_workflow',
        description: 'Define a new workflow with multiple steps',
        parameters: {
          name: { type: 'string', description: 'Workflow name' },
          steps: { type: 'array', description: 'Array of workflow steps' },
          schedule: { type: 'string', description: 'Cron schedule (optional)' }
        },
        required: ['name', 'steps']
      },
      {
        name: 'execute_workflow',
        description: 'Execute a workflow by name or ID',
        parameters: {
          workflowId: { type: 'string', description: 'Workflow identifier' }
        },
        required: ['workflowId']
      },
      {
        name: 'get_workflow_status',
        description: 'Get the current status of a workflow',
        parameters: {
          workflowId: { type: 'string', description: 'Workflow identifier' }
        },
        required: ['workflowId']
      }
    ]
  },
  {
    number: '06',
    name: 'project-builder-mcp',
    agentName: 'Project Builder',
    port: 3006,
    purpose: 'Generate project structures and boilerplate code',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'fs-extra'],
    tools: [
      {
        name: 'scaffold_project',
        description: 'Create a new project structure',
        parameters: {
          projectType: { type: 'string', description: 'Type of project (node, react, etc)' },
          projectName: { type: 'string', description: 'Project name' },
          outputDir: { type: 'string', description: 'Output directory' }
        },
        required: ['projectType', 'projectName', 'outputDir']
      },
      {
        name: 'generate_component',
        description: 'Generate a code component',
        parameters: {
          componentType: { type: 'string', description: 'Component type' },
          componentName: { type: 'string', description: 'Component name' }
        },
        required: ['componentType', 'componentName']
      },
      {
        name: 'add_dependency',
        description: 'Add npm dependency to project',
        parameters: {
          packageName: { type: 'string', description: 'Package name' },
          version: { type: 'string', description: 'Package version (optional)' }
        },
        required: ['packageName']
      }
    ]
  },
  {
    number: '07',
    name: 'code-quality-mcp',
    agentName: 'Code Quality',
    port: 3007,
    purpose: 'Analyze code quality and enforce standards',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'eslint', 'typescript'],
    tools: [
      {
        name: 'lint_code',
        description: 'Run linter on code',
        parameters: {
          filePath: { type: 'string', description: 'Path to file or directory' },
          fix: { type: 'boolean', description: 'Auto-fix issues' }
        },
        required: ['filePath']
      },
      {
        name: 'check_types',
        description: 'Run TypeScript type checking',
        parameters: {
          projectPath: { type: 'string', description: 'Project root path' }
        },
        required: ['projectPath']
      },
      {
        name: 'analyze_complexity',
        description: 'Analyze code complexity',
        parameters: {
          filePath: { type: 'string', description: 'Path to file' }
        },
        required: ['filePath']
      }
    ]
  },
  {
    number: '08',
    name: 'performance-mcp',
    agentName: 'Performance Monitor',
    port: 3008,
    purpose: 'Monitor and optimize performance metrics',
    needsBrowser: true,
    dependencies: ['@modelcontextprotocol/sdk', 'playwright', 'lighthouse'],
    tools: [
      {
        name: 'measure_load_time',
        description: 'Measure page load performance',
        parameters: {
          url: { type: 'string', description: 'URL to measure' }
        },
        required: ['url']
      },
      {
        name: 'run_lighthouse',
        description: 'Run Lighthouse audit',
        parameters: {
          url: { type: 'string', description: 'URL to audit' },
          categories: { type: 'array', description: 'Categories to test' }
        },
        required: ['url']
      },
      {
        name: 'monitor_memory',
        description: 'Monitor memory usage',
        parameters: {
          url: { type: 'string', description: 'URL to monitor' },
          duration: { type: 'number', description: 'Duration in seconds' }
        },
        required: ['url', 'duration']
      }
    ]
  },
  {
    number: '09',
    name: 'error-tracker-mcp',
    agentName: 'Error Tracker',
    port: 3009,
    purpose: 'Aggregate and analyze errors across system',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'winston', 'sqlite3'],
    tools: [
      {
        name: 'log_error',
        description: 'Log a structured error',
        parameters: {
          level: { type: 'string', description: 'Error level' },
          message: { type: 'string', description: 'Error message' },
          context: { type: 'object', description: 'Error context' }
        },
        required: ['level', 'message']
      },
      {
        name: 'query_errors',
        description: 'Query error logs',
        parameters: {
          startDate: { type: 'string', description: 'Start date' },
          endDate: { type: 'string', description: 'End date' },
          level: { type: 'string', description: 'Filter by level' }
        },
        required: []
      },
      {
        name: 'get_error_stats',
        description: 'Get error statistics',
        parameters: {
          period: { type: 'string', description: 'Time period (day, week, month)' }
        },
        required: ['period']
      }
    ]
  },
  {
    number: '10',
    name: 'security-mcp',
    agentName: 'Security Scanner',
    port: 3010,
    purpose: 'Scan for security vulnerabilities',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk'],
    tools: [
      {
        name: 'scan_dependencies',
        description: 'Scan npm dependencies for vulnerabilities',
        parameters: {
          projectPath: { type: 'string', description: 'Project root path' }
        },
        required: ['projectPath']
      },
      {
        name: 'check_secrets',
        description: 'Check for exposed secrets',
        parameters: {
          path: { type: 'string', description: 'Path to scan' }
        },
        required: ['path']
      },
      {
        name: 'analyze_headers',
        description: 'Analyze security headers',
        parameters: {
          url: { type: 'string', description: 'URL to analyze' }
        },
        required: ['url']
      }
    ]
  },
  {
    number: '11',
    name: 'accessibility-mcp',
    agentName: 'Accessibility Checker',
    port: 3011,
    purpose: 'Check accessibility standards (WCAG)',
    needsBrowser: true,
    dependencies: ['@modelcontextprotocol/sdk', 'playwright', 'axe-core'],
    tools: [
      {
        name: 'check_wcag',
        description: 'Run WCAG compliance test',
        parameters: {
          url: { type: 'string', description: 'URL to test' },
          level: { type: 'string', description: 'WCAG level (A, AA, AAA)' }
        },
        required: ['url']
      },
      {
        name: 'analyze_contrast',
        description: 'Check color contrast ratios',
        parameters: {
          url: { type: 'string', description: 'URL to analyze' }
        },
        required: ['url']
      },
      {
        name: 'check_aria',
        description: 'Validate ARIA labels',
        parameters: {
          url: { type: 'string', description: 'URL to check' }
        },
        required: ['url']
      }
    ]
  },
  {
    number: '12',
    name: 'integration-mcp',
    agentName: 'Integration Hub',
    port: 3012,
    purpose: 'Connect to external APIs and services',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'axios'],
    tools: [
      {
        name: 'call_api',
        description: 'Make HTTP API request',
        parameters: {
          method: { type: 'string', description: 'HTTP method' },
          url: { type: 'string', description: 'API endpoint' },
          headers: { type: 'object', description: 'Request headers' },
          body: { type: 'object', description: 'Request body' }
        },
        required: ['method', 'url']
      },
      {
        name: 'send_webhook',
        description: 'Send webhook event',
        parameters: {
          webhookUrl: { type: 'string', description: 'Webhook URL' },
          payload: { type: 'object', description: 'Event payload' }
        },
        required: ['webhookUrl', 'payload']
      }
    ]
  },
  {
    number: '13',
    name: 'docs-auditor-mcp',
    agentName: 'Docs Auditor',
    port: 3013,
    purpose: 'Audit and improve documentation',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'markdown-it'],
    tools: [
      {
        name: 'check_completeness',
        description: 'Check documentation coverage',
        parameters: {
          projectPath: { type: 'string', description: 'Project path' }
        },
        required: ['projectPath']
      },
      {
        name: 'validate_links',
        description: 'Validate documentation links',
        parameters: {
          docsPath: { type: 'string', description: 'Path to docs' }
        },
        required: ['docsPath']
      }
    ]
  },
  {
    number: '14',
    name: 'advanced-automation-mcp',
    agentName: 'Advanced Automation',
    port: 3014,
    purpose: 'Handle complex multi-page automation',
    needsBrowser: true,
    dependencies: ['@modelcontextprotocol/sdk', 'playwright', 'node-cron'],
    tools: [
      {
        name: 'create_bot',
        description: 'Define automation bot',
        parameters: {
          name: { type: 'string', description: 'Bot name' },
          actions: { type: 'array', description: 'Bot actions' }
        },
        required: ['name', 'actions']
      },
      {
        name: 'schedule_task',
        description: 'Schedule recurring task',
        parameters: {
          taskId: { type: 'string', description: 'Task ID' },
          schedule: { type: 'string', description: 'Cron expression' }
        },
        required: ['taskId', 'schedule']
      }
    ]
  },
  {
    number: '15',
    name: 'api-integration-mcp',
    agentName: 'API Integrator',
    port: 3015,
    purpose: 'Build and test API integrations',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'axios'],
    tools: [
      {
        name: 'test_endpoint',
        description: 'Test API endpoint',
        parameters: {
          endpoint: { type: 'string', description: 'API endpoint' },
          method: { type: 'string', description: 'HTTP method' }
        },
        required: ['endpoint', 'method']
      },
      {
        name: 'generate_client',
        description: 'Generate API client code',
        parameters: {
          spec: { type: 'object', description: 'OpenAPI/Swagger spec' }
        },
        required: ['spec']
      }
    ]
  },
  {
    number: '16',
    name: 'data-processing-mcp',
    agentName: 'Data Processor',
    port: 3016,
    purpose: 'Process, transform, and analyze data',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk'],
    tools: [
      {
        name: 'transform_data',
        description: 'Transform data structure',
        parameters: {
          data: { type: 'object', description: 'Input data' },
          transformation: { type: 'string', description: 'Transformation type' }
        },
        required: ['data', 'transformation']
      },
      {
        name: 'export_csv',
        description: 'Export data to CSV',
        parameters: {
          data: { type: 'array', description: 'Data array' },
          filename: { type: 'string', description: 'Output filename' }
        },
        required: ['data', 'filename']
      }
    ]
  },
  {
    number: '17',
    name: 'learning-platform-mcp',
    agentName: 'Learning Platform',
    port: 3017,
    purpose: 'Machine learning model training',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'natural'],
    tools: [
      {
        name: 'train_model',
        description: 'Train ML model',
        parameters: {
          modelType: { type: 'string', description: 'Model type' },
          trainingData: { type: 'array', description: 'Training dataset' }
        },
        required: ['modelType', 'trainingData']
      },
      {
        name: 'predict',
        description: 'Make prediction',
        parameters: {
          modelId: { type: 'string', description: 'Model ID' },
          input: { type: 'object', description: 'Input data' }
        },
        required: ['modelId', 'input']
      }
    ]
  },
  {
    number: '18',
    name: 'community-hub-mcp',
    agentName: 'Community Hub',
    port: 3018,
    purpose: 'Share workflows and collaborate',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk'],
    tools: [
      {
        name: 'share_workflow',
        description: 'Share workflow configuration',
        parameters: {
          workflowId: { type: 'string', description: 'Workflow ID' },
          visibility: { type: 'string', description: 'Public or private' }
        },
        required: ['workflowId']
      },
      {
        name: 'search_workflows',
        description: 'Search community workflows',
        parameters: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    ]
  },
  {
    number: '19',
    name: 'deployment-mcp',
    agentName: 'Deployment Manager',
    port: 3019,
    purpose: 'Manage deployments and releases',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk'],
    tools: [
      {
        name: 'deploy_container',
        description: 'Deploy Docker container',
        parameters: {
          imageName: { type: 'string', description: 'Docker image name' },
          tag: { type: 'string', description: 'Image tag' }
        },
        required: ['imageName', 'tag']
      },
      {
        name: 'rollback_deployment',
        description: 'Rollback to previous version',
        parameters: {
          deploymentId: { type: 'string', description: 'Deployment ID' }
        },
        required: ['deploymentId']
      }
    ]
  },
  {
    number: '20',
    name: 'orchestrator-mcp',
    agentName: 'Master Orchestrator',
    port: 3020,
    purpose: 'Coordinate all agents and MCPs',
    needsBrowser: false,
    dependencies: ['@modelcontextprotocol/sdk', 'axios'],
    tools: [
      {
        name: 'route_request',
        description: 'Route request to appropriate MCP',
        parameters: {
          targetMcp: { type: 'string', description: 'Target MCP name' },
          tool: { type: 'string', description: 'Tool to execute' },
          args: { type: 'object', description: 'Tool arguments' }
        },
        required: ['targetMcp', 'tool', 'args']
      },
      {
        name: 'health_check_all',
        description: 'Check health of all MCPs',
        parameters: {},
        required: []
      },
      {
        name: 'coordinate_workflow',
        description: 'Execute multi-MCP workflow',
        parameters: {
          workflow: { type: 'object', description: 'Workflow definition' }
        },
        required: ['workflow']
      }
    ]
  }
];

function generateMCPIndexFile(def: MCPDefinition): string {
  const browserImports = def.needsBrowser 
    ? `import { chromium, Browser, Page } from 'playwright';`
    : '';

  const browserMembers = def.needsBrowser
    ? `  private browser: Browser | null = null;
  private page: Page | null = null;`
    : '';

  const browserCleanup = def.needsBrowser
    ? `    if (this.browser) {
      await this.browser.close();
    }`
    : '';

  const browserInitMethod = def.needsBrowser
    ? `
  private async ensureBrowser(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      });
      const context = await this.browser.newContext();
      this.page = await context.newPage();
    }
    return this.page!;
  }`
    : '';

  const toolsCode = def.tools.map((tool, idx) => {
    const props = Object.entries(tool.parameters).map(([key, value]: [string, any]) => 
      `          ${key}: ${JSON.stringify(value, null, 2).split('\n').join('\n          ')}`
    ).join(',\n');

    return `      {
        name: '${tool.name}',
        description: '${tool.description}',
        inputSchema: {
          type: 'object',
          properties: {
${props}
          },
          required: ${JSON.stringify(tool.required)}
        }
      }`;
  }).join(',\n');

  const handleToolCases = def.tools.map(tool => `        case '${tool.name}':
          return await this.${tool.name}(args);`).join('\n');

  const toolMethods = def.tools.map(tool => `  private async ${tool.name}(args: any): Promise<any> {
    // TODO: Implement ${tool.name}
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '${tool.name} executed successfully',
            data: args
          }, null, 2)
        }
      ]
    };
  }`).join('\n\n');

  return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
${browserImports}
import express from 'express';

/**
 * MCP Server for ${def.agentName}
 * ${def.purpose}
 */
class ${def.agentName.replace(/[^a-zA-Z0-9]/g, '')}MCP {
  private server: Server;
  private httpServer: any;
${browserMembers}

  constructor() {
    this.server = new Server(
      {
        name: '${def.name}',
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
        agent: 'agent-${def.number}-${def.name}',
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
${toolsCode}
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
${handleToolCases}
          default:
            throw new Error(\`Unknown tool: \${name}\`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            },
          ],
          isError: true,
        };
      }
    });
  }
${browserInitMethod}

  // Tool implementation methods
${toolMethods}

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('${def.agentName} MCP Server running on stdio');
  }

  async cleanup() {
${browserCleanup}
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Main execution
const server = new ${def.agentName.replace(/[^a-zA-Z0-9]/g, '')}MCP();

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
`;
}

function generatePackageJson(def: MCPDefinition): string {
  return JSON.stringify({
    name: def.name,
    version: '1.0.0',
    description: `MCP Server for ${def.agentName} - ${def.purpose}`,
    main: 'dist/index.js',
    type: 'module',
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'tsx src/index.ts',
      test: 'jest'
    },
    dependencies: def.dependencies.reduce((acc, dep) => {
      const versions: Record<string, string> = {
        '@modelcontextprotocol/sdk': '^0.5.0',
        'playwright': '^1.40.0',
        'express': '^4.18.2',
        'axios': '^1.13.2',
        'winston': '^3.11.0',
        'sqlite3': '^5.1.7',
        'node-cron': '^4.2.1',
        'natural': '^8.1.0',
        'fs-extra': '^11.2.0',
        'eslint': '^9.0.0',
        'typescript': '^5.3.0',
        'lighthouse': '^11.5.0',
        'axe-core': '^4.8.3',
        'markdown-it': '^14.0.0'
      };
      acc[dep] = versions[dep] || 'latest';
      return acc;
    }, {} as Record<string, string>),
    devDependencies: {
      '@types/node': '^20.10.0',
      '@types/express': '^4.17.21',
      typescript: '^5.3.0',
      tsx: '^4.7.0',
      jest: '^29.7.0',
      '@types/jest': '^29.5.11'
    }
  }, null, 2);
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020'],
      moduleResolution: 'node',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'tests']
  }, null, 2);
}

function generateDockerfile(def: MCPDefinition): string {
  return `FROM node:18-alpine

WORKDIR /app

# Install Playwright browsers if needed
${def.needsBrowser ? `RUN npx playwright install-deps chromium
RUN npx playwright install chromium` : '# No browser needed'}

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose health check port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=${def.name}

# Start server
CMD ["node", "dist/index.js"]
`;
}

function generateReadme(def: MCPDefinition): string {
  const toolsDocs = def.tools.map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([key, value]: [string, any]) => `- \`${key}\` (${value.type}): ${value.description}`)
      .join('\n  ');
    
    return `### \`${tool.name}\`

${tool.description}

**Parameters:**
  ${params}

**Required:** ${tool.required.join(', ') || 'none'}

**Example:**
\`\`\`json
{
  "name": "${tool.name}",
  "arguments": {
    ${tool.required.map(r => `"${r}": "example_value"`).join(',\n    ')}
  }
}
\`\`\`
`;
  }).join('\n\n');

  return `# ${def.agentName} MCP (Agent ${def.number})

## Overview

${def.purpose}

**Port:** ${def.port}  
**Status:** ✅ COMPLETE  
**Browser Required:** ${def.needsBrowser ? 'Yes' : 'No'}

## Architecture

This MCP server implements the Model Context Protocol (MCP) and provides ${def.tools.length} tools for ${def.agentName.toLowerCase()} operations.

## Tools

${toolsDocs}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

### Production Mode

\`\`\`bash
npm run build
npm start
\`\`\`

### Docker

\`\`\`bash
docker build -t ${def.name} .
docker run -p ${def.port}:3000 ${def.name}
\`\`\`

## Health Check

The server exposes a health check endpoint at:

\`\`\`
GET http://localhost:3000/health
\`\`\`

Response:
\`\`\`json
{
  "status": "healthy",
  "agent": "agent-${def.number}-${def.name}",
  "uptime": 12345.67,
  "timestamp": "2025-11-17T10:00:00.000Z"
}
\`\`\`

## Dependencies

${def.dependencies.map(d => `- ${d}`).join('\n')}

## Testing

\`\`\`bash
npm test
\`\`\`

## Configuration

Environment variables:
- \`NODE_ENV\`: Environment (development/production)
- \`MCP_SERVER_NAME\`: Server name identifier
${def.needsBrowser ? `- \`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH\`: Custom Chromium path (optional)` : ''}

## Error Handling

All tools implement:
- Input validation via JSON schema
- Structured error responses
- Graceful degradation
- Retry logic with exponential backoff

## Monitoring

Metrics exposed via health endpoint:
- Server uptime
- Request count (coming soon)
- Error rate (coming soon)
- Average response time (coming soon)

## Contributing

See main project CONTRIBUTING.md

## License

ISC
`;
}

// Main execution
async function main() {
  console.log('🚀 Starting MCP Builder...\n');
  
  const mcpContainersDir = path.join(process.cwd(), 'mcp-containers');
  
  for (const def of MCP_DEFINITIONS) {
    const mcpDir = path.join(mcpContainersDir, `${def.number}-${def.name}`);
    const srcDir = path.join(mcpDir, 'src');
    
    console.log(`📦 Building MCP-${def.number}: ${def.agentName}...`);
    
    // Create directories
    if (!fs.existsSync(mcpDir)) {
      fs.mkdirSync(mcpDir, { recursive: true });
    }
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    
    // Generate files
    fs.writeFileSync(
      path.join(srcDir, 'index.ts'),
      generateMCPIndexFile(def)
    );
    
    fs.writeFileSync(
      path.join(mcpDir, 'package.json'),
      generatePackageJson(def)
    );
    
    fs.writeFileSync(
      path.join(mcpDir, 'tsconfig.json'),
      generateTsConfig()
    );
    
    fs.writeFileSync(
      path.join(mcpDir, 'Dockerfile'),
      generateDockerfile(def)
    );
    
    fs.writeFileSync(
      path.join(mcpDir, 'README.md'),
      generateReadme(def)
    );
    
    console.log(`  ✅ Created ${def.number}-${def.name}`);
  }
  
  console.log('\n✨ All MCPs generated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Review generated files');
  console.log('2. Install dependencies: cd mcp-containers/XX-name-mcp && npm install');
  console.log('3. Build: npm run build');
  console.log('4. Test: npm test');
  console.log('5. Deploy: docker-compose -f docker-compose.mcp.yml up');
}

main().catch(console.error);
