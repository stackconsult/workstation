/// <reference types="jest" />
/**
 * MCP Routes Tests
 * Tests for Model Context Protocol endpoints
 */

import request from 'supertest';
import express, { Express } from 'express';
import mcpRoutes from '../src/routes/mcp';
import { generateDemoToken } from '../src/auth/jwt';

/**
 * Type definitions for test responses
 */
interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

interface Resource {
  name: string;
  description: string;
  mimeType: string;
  uri: string;
}

interface Prompt {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

interface MCPToolsResponse {
  tools: Tool[];
}

interface MCPResourcesResponse {
  resources: Resource[];
}

interface MCPPromptsResponse {
  prompts: Prompt[];
}

describe('MCP Routes', () => {
  let app: Express;
  let token: string;

  beforeAll(() => {
    // Setup express app with MCP routes
    app = express();
    app.use(express.json());
    app.use('/api/v2', mcpRoutes);

    // Generate test token
    token = generateDemoToken();
  });

  describe('GET /api/v2/mcp/tools', () => {
    it('should return list of tools with authentication', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/tools')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
      
      // Verify tool structure
      const firstTool = response.body.tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
    });

    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/v2/mcp/tools')
        .expect(401);
    });

    it('should include browser automation tools', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/tools')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      interface Tool {
        name: string;
        description: string;
        inputSchema: object;
        // Add other properties if needed
      }
      const toolNames = (response.body.tools as Tool[]).map((t: Tool) => t.name);
      expect(toolNames).toContain('browser_navigate');
      expect(toolNames).toContain('browser_click');
      expect(toolNames).toContain('browser_type');
      expect(toolNames).toContain('browser_screenshot');
    });
  });

  describe('POST /api/v2/mcp/tools/:toolName', () => {
    it('should execute browser_navigate tool', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/tools/browser_navigate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com',
          waitUntil: 'load'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
    });

    it('should return 404 for unknown tool', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/tools/nonexistent_tool')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'TOOL_NOT_FOUND');
      expect(response.body.error).toHaveProperty('availableTools');
    });

    it('should handle workflow_create tool', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/tools/workflow_create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Workflow',
          tasks: [
            {
              name: 'navigate',
              agent_type: 'browser',
              action: 'navigate',
              parameters: { url: 'https://example.com' }
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('endpoint');
    });
  });

  describe('GET /api/v2/mcp/resources', () => {
    it('should return list of resources', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/resources')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      
      const typedResponse = response.body as MCPResourcesResponse;
      const resourceNames = typedResponse.resources.map((r: Resource) => r.name);
      expect(resourceNames).toContain('workflows');
      expect(resourceNames).toContain('screenshots');
      expect(resourceNames).toContain('page_content');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v2/mcp/resources')
        .expect(401);
    });
  });

  describe('GET /api/v2/mcp/resources/:resourceName', () => {
    it('should access workflows resource', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/resources/workflows')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('resource', 'workflows');
      expect(response.body).toHaveProperty('mimeType', 'application/json');
      expect(response.body).toHaveProperty('data');
    });

    it('should return 404 for unknown resource', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/resources/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });

  describe('GET /api/v2/mcp/prompts', () => {
    it('should return list of prompts', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/prompts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('prompts');
      expect(Array.isArray(response.body.prompts)).toBe(true);
      
      const typedResponse = response.body as MCPPromptsResponse;
      const promptNames = typedResponse.prompts.map((p: Prompt) => p.name);
      expect(promptNames).toContain('scrape_website');
      expect(promptNames).toContain('fill_form');
      expect(promptNames).toContain('monitor_page');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v2/mcp/prompts')
        .expect(401);
    });
  });

  describe('POST /api/v2/mcp/prompts/:promptName', () => {
    it('should execute scrape_website prompt', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/prompts/scrape_website')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com',
          selectors: {
            title: 'h1',
            description: 'p.description'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('workflowDefinition');
      expect(response.body.workflowDefinition).toHaveProperty('tasks');
    });

    it('should execute fill_form prompt', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/prompts/fill_form')
        .set('Authorization', `Bearer ${token}`)
        .send({
          url: 'https://example.com/form',
          fields: {
            '#name': 'John Doe',
            '#email': 'john@example.com'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.workflowDefinition.tasks.length).toBeGreaterThan(1);
    });

    it('should validate required arguments', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/prompts/scrape_website')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required 'url' argument
          selectors: { title: 'h1' }
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'MISSING_ARGUMENTS');
      expect(response.body.error.missing).toContain('url');
    });

    it('should return 404 for unknown prompt', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/prompts/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'PROMPT_NOT_FOUND');
    });
  });

  describe('GET /api/v2/mcp/server-info', () => {
    it('should return server information', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/server-info')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'workstation-mcp-server');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body).toHaveProperty('documentation');
      expect(response.body).toHaveProperty('endpoints');
    });

    it('should not require authentication', async () => {
      // Server info endpoint should be public
      await request(app)
        .get('/api/v2/mcp/server-info')
        .expect(200);
    });

    it('should report correct capability counts', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/server-info')
        .expect(200);

      expect(response.body.capabilities.tools).toBeGreaterThan(0);
      expect(response.body.capabilities.resources).toBeGreaterThan(0);
      expect(response.body.capabilities.prompts).toBeGreaterThan(0);
    });
  });

  describe('Tool Input Schemas', () => {
    it('should have valid JSON schemas for all tools', async () => {
      const response = await request(app)
        .get('/api/v2/mcp/tools')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const typedResponse = response.body as MCPToolsResponse;
      typedResponse.tools.forEach((tool: Tool) => {
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        
        if ('required' in tool.inputSchema) {
          expect(Array.isArray((tool.inputSchema as any).required)).toBe(true);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/v2/mcp/tools/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
