import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page, Locator } from 'playwright';
import express from 'express';

/**
 * MCP Server for CSS Selector Generation, Validation, and Optimization
 * Provides tools to build, test, and optimize CSS selectors for web automation
 */
class SelectorBuilderMCP {
  private server: Server;
  private browser: Browser | null = null;
  private httpServer: any;

  constructor() {
    this.server = new Server(
      {
        name: 'selector-builder-mcp',
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
        agent: 'agent-01-selector-builder',
        uptime: process.uptime()
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
        name: 'generate_selector',
        description: 'Generate a CSS selector for an element on a webpage based on text content or attributes',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the webpage',
            },
            targetText: {
              type: 'string',
              description: 'Text content of the target element (optional)',
            },
            targetAttribute: {
              type: 'object',
              description: 'Attribute to match (e.g., {name: "id", value: "submit-btn"})',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' }
              }
            }
          },
          required: ['url'],
        },
      },
      {
        name: 'validate_selector',
        description: 'Test if a CSS selector works on a webpage and returns match count',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the webpage',
            },
            selector: {
              type: 'string',
              description: 'The CSS selector to validate',
            },
          },
          required: ['url', 'selector'],
        },
      },
      {
        name: 'optimize_selector',
        description: 'Optimize a CSS selector to be more robust and shorter',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the webpage',
            },
            selector: {
              type: 'string',
              description: 'The CSS selector to optimize',
            },
          },
          required: ['url', 'selector'],
        },
      },
      {
        name: 'extract_with_selector',
        description: 'Extract data from webpage using a CSS selector',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the webpage',
            },
            selector: {
              type: 'string',
              description: 'The CSS selector to use for extraction',
            },
            extractType: {
              type: 'string',
              enum: ['text', 'html', 'attribute'],
              description: 'Type of data to extract',
            },
            attributeName: {
              type: 'string',
              description: 'Attribute name if extractType is "attribute"',
            },
          },
          required: ['url', 'selector', 'extractType'],
        },
      },
      {
        name: 'monitor_selector_changes',
        description: 'Monitor if a selector remains valid over time by checking periodically',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the webpage',
            },
            selector: {
              type: 'string',
              description: 'The CSS selector to monitor',
            },
          },
          required: ['url', 'selector'],
        },
      },
    ];

    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_selector':
            return await this.generateSelector(args);
          case 'validate_selector':
            return await this.validateSelector(args);
          case 'optimize_selector':
            return await this.optimizeSelector(args);
          case 'extract_with_selector':
            return await this.extractWithSelector(args);
          case 'monitor_selector_changes':
            return await this.monitorSelectorChanges(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  private async generateSelector(args: any) {
    const { url, targetText, targetAttribute } = args;
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      let element: Locator;

      if (targetText) {
        // Find by text content
        element = page.locator(`text="${targetText}"`).first();
      } else if (targetAttribute) {
        // Find by attribute
        element = page.locator(`[${targetAttribute.name}="${targetAttribute.value}"]`).first();
      } else {
        throw new Error('Either targetText or targetAttribute must be provided');
      }

      // Generate selector
      const selector = await element.evaluate((el) => {
        // Try ID first (most specific)
        if (el.id) {
          return `#${el.id}`;
        }

        // Build path from element to root
        const path: string[] = [];
        let current: Element | null = el;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let selector = current.nodeName.toLowerCase();

          // Add classes if present
          if (current.classList.length > 0) {
            selector += '.' + Array.from(current.classList).join('.');
          }

          // Add nth-of-type if necessary
          if (current.parentNode) {
            const siblings = Array.from(current.parentNode.children);
            const sameType = siblings.filter((s): s is Element => s.nodeName === current!.nodeName);
            if (sameType.length > 1) {
              const index = sameType.indexOf(current) + 1;
              selector += `:nth-of-type(${index})`;
            }
          }

          path.unshift(selector);

          // Stop at element with ID
          if (current.id) {
            break;
          }

          current = current.parentElement;
        }

        return path.join(' > ');
      });

      await page.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              selector,
              confidence: 0.9,
              method: targetText ? 'text-match' : 'attribute-match',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      await page.close();
      throw error;
    }
  }

  private async validateSelector(args: any) {
    const { url, selector } = args;
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const elements = page.locator(selector);
      const count = await elements.count();
      const isValid = count > 0;

      let sampleText = '';
      if (isValid) {
        sampleText = await elements.first().textContent() || '';
      }

      await page.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              valid: isValid,
              matchCount: count,
              sampleText: sampleText.substring(0, 100),
              selector,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      await page.close();
      throw error;
    }
  }

  private async optimizeSelector(args: any) {
    const { url, selector } = args;
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const element = page.locator(selector).first();
      const count = await page.locator(selector).count();

      if (count === 0) {
        throw new Error('Selector does not match any elements');
      }

      // Generate optimized selector
      const optimized = await element.evaluate((el) => {
        // Priority: ID > data-testid > class + nth-of-type > full path
        if (el.id) {
          return `#${el.id}`;
        }

        const testId = el.getAttribute('data-testid');
        if (testId) {
          return `[data-testid="${testId}"]`;
        }

        // Try class-based selector
        if (el.classList.length > 0) {
          const classes = Array.from(el.classList).slice(0, 2).join('.');
          return el.nodeName.toLowerCase() + '.' + classes;
        }

        // Fallback to nodeName with nth-of-type
        const siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
        const sameType = siblings.filter((s): s is Element => s.nodeName === el.nodeName);
        const index = sameType.indexOf(el) + 1;
        return `${el.nodeName.toLowerCase()}:nth-of-type(${index})`;
      });

      await page.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              original: selector,
              optimized,
              improvement: selector.length - optimized.length,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      await page.close();
      throw error;
    }
  }

  private async extractWithSelector(args: any) {
    const { url, selector, extractType, attributeName } = args;
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const elements = page.locator(selector);
      const count = await elements.count();

      if (count === 0) {
        throw new Error('Selector does not match any elements');
      }

      const results: any[] = [];

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = elements.nth(i);
        let value = '';

        switch (extractType) {
          case 'text':
            value = await element.textContent() || '';
            break;
          case 'html':
            value = await element.innerHTML();
            break;
          case 'attribute':
            if (!attributeName) {
              throw new Error('attributeName required for attribute extraction');
            }
            value = await element.getAttribute(attributeName) || '';
            break;
        }

        results.push(value);
      }

      await page.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              selector,
              extractType,
              matchCount: count,
              results,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      await page.close();
      throw error;
    }
  }

  private async monitorSelectorChanges(args: any) {
    const { url, selector } = args;
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const initialCount = await page.locator(selector).count();
      const isValid = initialCount > 0;

      await page.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              selector,
              timestamp: new Date().toISOString(),
              valid: isValid,
              matchCount: initialCount,
              status: isValid ? 'active' : 'broken',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      await page.close();
      throw error;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Selector Builder MCP Server running on stdio');
    console.error('Health check available at http://localhost:3000/health');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Handle graceful shutdown
const server = new SelectorBuilderMCP();

process.on('SIGINT', async () => {
  console.error('Shutting down gracefully...');
  await server.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down gracefully...');
  await server.cleanup();
  process.exit(0);
});

server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
