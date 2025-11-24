/**
 * Template Engine - Generates code templates based on configuration
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Mustache from 'mustache';
import { BuilderConfig } from '../index';

export class TemplateEngine {
  /**
   * Generate all templates for the project
   */
  async generateTemplates(config: BuilderConfig, projectPath: string): Promise<void> {
    // Generate main index.ts (MCP server entry point)
    await this.generateMainIndex(config, projectPath);

    // Generate tools based on selected features
    await this.generateTools(config, projectPath);

    // Generate handlers
    await this.generateHandlers(config, projectPath);

    // Generate utility functions
    await this.generateUtils(config, projectPath);

    // Generate tests
    await this.generateTests(config, projectPath);

    // Generate examples
    await this.generateExamples(config, projectPath);
  }

  private async generateMainIndex(config: BuilderConfig, projectPath: string): Promise<void> {
    const template = `/**
 * {{projectName}} - MCP Server
 * {{description}}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

{{#hasImports}}
// Feature imports
{{#hasBrowser}}
import { setupBrowserTools } from './tools/browser.js';
{{/hasBrowser}}
{{#hasDatabase}}
import { setupDatabaseTools } from './tools/database.js';
{{/hasDatabase}}
{{#hasFiles}}
import { setupFileTools } from './tools/files.js';
{{/hasFiles}}
{{#hasApi}}
import { setupApiTools } from './tools/api.js';
{{/hasApi}}
{{#hasEmail}}
import { setupEmailTools } from './tools/email.js';
{{/hasEmail}}
{{/hasImports}}

const server = new Server(
  {
    name: '{{projectName}}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
const tools = [
{{#hasBrowser}}
  ...setupBrowserTools(),
{{/hasBrowser}}
{{#hasDatabase}}
  ...setupDatabaseTools(),
{{/hasDatabase}}
{{#hasFiles}}
  ...setupFileTools(),
{{/hasFiles}}
{{#hasApi}}
  ...setupApiTools(),
{{/hasApi}}
{{#hasEmail}}
  ...setupEmailTools(),
{{/hasEmail}}
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    {{#hasBrowser}}
    if (name.startsWith('browser_')) {
      const { handleBrowserTool } = await import('./handlers/browser.js');
      return await handleBrowserTool(name, args);
    }
    {{/hasBrowser}}
    {{#hasDatabase}}
    if (name.startsWith('db_')) {
      const { handleDatabaseTool } = await import('./handlers/database.js');
      return await handleDatabaseTool(name, args);
    }
    {{/hasDatabase}}
    {{#hasFiles}}
    if (name.startsWith('file_')) {
      const { handleFileTool } = await import('./handlers/files.js');
      return await handleFileTool(name, args);
    }
    {{/hasFiles}}
    {{#hasApi}}
    if (name.startsWith('api_')) {
      const { handleApiTool } = await import('./handlers/api.js');
      return await handleApiTool(name, args);
    }
    {{/hasApi}}
    {{#hasEmail}}
    if (name.startsWith('email_')) {
      const { handleEmailTool } = await import('./handlers/email.js');
      return await handleEmailTool(name, args);
    }
    {{/hasEmail}}

    throw new Error(\`Unknown tool: \${name}\`);
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{projectName}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;

    const data = {
      projectName: config.projectName,
      description: config.description,
      hasImports: config.features.length > 0,
      hasBrowser: config.features.includes('browser'),
      hasDatabase: config.features.includes('database'),
      hasFiles: config.features.includes('files'),
      hasApi: config.features.includes('api'),
      hasEmail: config.features.includes('email')
    };

    const content = Mustache.render(template, data);
    await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), content);
  }

  private async generateTools(config: BuilderConfig, projectPath: string): Promise<void> {
    const toolsDir = path.join(projectPath, 'src', 'tools');

    if (config.features.includes('browser')) {
      await this.generateBrowserTools(toolsDir);
    }
    if (config.features.includes('database')) {
      await this.generateDatabaseTools(toolsDir);
    }
    if (config.features.includes('files')) {
      await this.generateFileTools(toolsDir);
    }
    if (config.features.includes('api')) {
      await this.generateApiTools(toolsDir);
    }
    if (config.features.includes('email')) {
      await this.generateEmailTools(toolsDir);
    }
  }

  private async generateBrowserTools(toolsDir: string): Promise<void> {
    const content = `/**
 * Browser automation tools
 */

export function setupBrowserTools() {
  return [
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL in the browser',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to',
          },
          waitUntil: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            description: 'When to consider navigation complete',
            default: 'load',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          fullPage: {
            type: 'boolean',
            description: 'Capture full page screenshot',
            default: false,
          },
          path: {
            type: 'string',
            description: 'Path to save screenshot',
          },
        },
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the page',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to click',
          },
        },
        required: ['selector'],
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an input element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the input element',
          },
          text: {
            type: 'string',
            description: 'Text to type',
          },
        },
        required: ['selector', 'text'],
      },
    },
    {
      name: 'browser_get_text',
      description: 'Extract text content from an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element',
          },
        },
        required: ['selector'],
      },
    },
  ];
}
`;
    await fs.writeFile(path.join(toolsDir, 'browser.ts'), content);
  }

  private async generateDatabaseTools(toolsDir: string): Promise<void> {
    const content = `/**
 * Database operation tools
 */

export function setupDatabaseTools() {
  return [
    {
      name: 'db_query',
      description: 'Execute a SQL query',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query to execute',
          },
          params: {
            type: 'array',
            description: 'Query parameters',
            items: { type: 'string' },
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'db_insert',
      description: 'Insert data into a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'Table name',
          },
          data: {
            type: 'object',
            description: 'Data to insert',
          },
        },
        required: ['table', 'data'],
      },
    },
  ];
}
`;
    await fs.writeFile(path.join(toolsDir, 'database.ts'), content);
  }

  private async generateFileTools(toolsDir: string): Promise<void> {
    const content = `/**
 * File processing tools
 */

export function setupFileTools() {
  return [
    {
      name: 'file_read_csv',
      description: 'Read and parse a CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to CSV file',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'file_read_excel',
      description: 'Read and parse an Excel file',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to Excel file',
          },
          sheet: {
            type: 'string',
            description: 'Sheet name to read',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'file_read_pdf',
      description: 'Extract text from a PDF file',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to PDF file',
          },
        },
        required: ['path'],
      },
    },
  ];
}
`;
    await fs.writeFile(path.join(toolsDir, 'files.ts'), content);
  }

  private async generateApiTools(toolsDir: string): Promise<void> {
    const content = `/**
 * API integration tools
 */

export function setupApiTools() {
  return [
    {
      name: 'api_request',
      description: 'Make an HTTP API request',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'API endpoint URL',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method',
            default: 'GET',
          },
          headers: {
            type: 'object',
            description: 'Request headers',
          },
          body: {
            type: 'object',
            description: 'Request body',
          },
        },
        required: ['url'],
      },
    },
  ];
}
`;
    await fs.writeFile(path.join(toolsDir, 'api.ts'), content);
  }

  private async generateEmailTools(toolsDir: string): Promise<void> {
    const content = `/**
 * Email sending tools
 */

export function setupEmailTools() {
  return [
    {
      name: 'email_send',
      description: 'Send an email',
      inputSchema: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Email subject',
          },
          body: {
            type: 'string',
            description: 'Email body (HTML or plain text)',
          },
          html: {
            type: 'boolean',
            description: 'Whether body is HTML',
            default: false,
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  ];
}
`;
    await fs.writeFile(path.join(toolsDir, 'email.ts'), content);
  }

  private async generateHandlers(config: BuilderConfig, projectPath: string): Promise<void> {
    const handlersDir = path.join(projectPath, 'src', 'handlers');

    if (config.features.includes('browser')) {
      await this.generateBrowserHandler(handlersDir);
    }
    // Add other handlers similarly...
  }

  private async generateBrowserHandler(handlersDir: string): Promise<void> {
    const content = `/**
 * Browser automation handler
 */

import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  }
  return page!;
}

export async function handleBrowserTool(name: string, args: any) {
  const currentPage = await ensureBrowser();

  switch (name) {
    case 'browser_navigate':
      await currentPage.goto(args.url, { waitUntil: args.waitUntil || 'load' });
      return {
        content: [{ type: 'text', text: \`Navigated to \${args.url}\` }],
      };

    case 'browser_screenshot':
      const screenshot = await currentPage.screenshot({ 
        fullPage: args.fullPage || false,
        path: args.path
      });
      return {
        content: [
          { 
            type: 'text', 
            text: args.path ? \`Screenshot saved to \${args.path}\` : 'Screenshot captured'
          }
        ],
      };

    case 'browser_click':
      await currentPage.click(args.selector);
      return {
        content: [{ type: 'text', text: \`Clicked \${args.selector}\` }],
      };

    case 'browser_type':
      await currentPage.fill(args.selector, args.text);
      return {
        content: [{ type: 'text', text: \`Typed into \${args.selector}\` }],
      };

    case 'browser_get_text':
      const element = await currentPage.$(args.selector);
      const text = element ? await element.textContent() : null;
      return {
        content: [{ type: 'text', text: text || 'No text found' }],
      };

    default:
      throw new Error(\`Unknown browser tool: \${name}\`);
  }
}

process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});
`;
    await fs.writeFile(path.join(handlersDir, 'browser.ts'), content);
  }

  private async generateUtils(config: BuilderConfig, projectPath: string): Promise<void> {
    const utilsDir = path.join(projectPath, 'src', 'utils');
    
    // Generate logger utility
    const loggerContent = `/**
 * Logger utility
 */

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = \`[\${timestamp}] [\${level.toUpperCase()}]\`;
  
  switch (level) {
    case 'error':
      console.error(\`\${prefix} \${message}\`);
      break;
    case 'warn':
      console.warn(\`\${prefix} \${message}\`);
      break;
    default:
      console.log(\`\${prefix} \${message}\`);
  }
}
`;
    await fs.writeFile(path.join(utilsDir, 'logger.ts'), loggerContent);
  }

  private async generateTests(config: BuilderConfig, projectPath: string): Promise<void> {
    const testsDir = path.join(projectPath, 'tests');
    
    const testContent = `/**
 * Basic tests for ${config.projectName}
 */

describe('${config.projectName}', () => {
  it('should initialize successfully', () => {
    expect(true).toBe(true);
  });
});
`;
    await fs.writeFile(path.join(testsDir, 'basic.test.ts'), testContent);
  }

  private async generateExamples(config: BuilderConfig, projectPath: string): Promise<void> {
    const examplesDir = path.join(projectPath, 'examples');
    
    const exampleContent = `# Examples

## Using with Claude Desktop

1. Add to your Claude Desktop configuration
2. Restart Claude Desktop
3. Use the tools in your conversations

## Example prompts:

${config.features.includes('browser') ? '- "Navigate to https://example.com and take a screenshot"\n' : ''}${config.features.includes('files') ? '- "Read the CSV file at data.csv and show me the first 10 rows"\n' : ''}${config.features.includes('api') ? '- "Make a GET request to https://api.example.com/data"\n' : ''}
`;
    await fs.writeFile(path.join(examplesDir, 'README.md'), exampleContent);
  }
}
