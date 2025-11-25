// Integration tests for Agent17 main class
import Agent17 from '../../src/index.js';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newContext: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          setDefaultTimeout: jest.fn(),
          goto: jest.fn().mockResolvedValue(undefined),
          evaluate: jest.fn().mockResolvedValue([]),
          waitForSelector: jest.fn().mockResolvedValue(undefined),
          waitForTimeout: jest.fn().mockResolvedValue(undefined),
          locator: jest.fn().mockReturnValue({
            click: jest.fn().mockResolvedValue(undefined),
            fill: jest.fn().mockResolvedValue(undefined),
            evaluate: jest.fn().mockResolvedValue('input'),
          }),
          close: jest.fn().mockResolvedValue(undefined),
          url: jest.fn().mockReturnValue('https://example.com'),
          title: jest.fn().mockResolvedValue('Example Page'),
          screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  setLogLevel: jest.fn(),
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('Agent17 Integration Tests', () => {
  let agent: Agent17;

  beforeEach(() => {
    agent = new Agent17({ headless: true, logLevel: 'error' });
  });

  afterEach(async () => {
    if (agent) {
      await agent.close();
    }
  });

  describe('Initialization', () => {
    it('should create agent instance', () => {
      expect(agent).toBeInstanceOf(Agent17);
    });

    it('should initialize successfully', async () => {
      await expect(agent.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await agent.initialize();
      await expect(agent.initialize()).resolves.not.toThrow();
    });

    it('should accept custom configuration', () => {
      const customAgent = new Agent17({
        headless: false,
        logLevel: 'debug',
      });
      expect(customAgent).toBeInstanceOf(Agent17);
    });
  });

  describe('Search Functionality', () => {
    it('should perform search', async () => {
      const result = await agent.search({
        query: 'test query',
        searchEngine: 'google',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should perform multi-engine search', async () => {
      const result = await agent.multiSearch('test query', ['google', 'bing']);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should auto-initialize before search', async () => {
      const newAgent = new Agent17();
      const result = await newAgent.search({ query: 'test' });

      expect(result).toBeDefined();
      await newAgent.close();
    });
  });

  describe('Click Functionality', () => {
    it('should click element', async () => {
      const result = await agent.clickElement({
        url: 'https://example.com',
        selector: 'button#submit',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.clicked).toBe('button#submit');
    });

    it('should auto-initialize before click', async () => {
      const newAgent = new Agent17();
      const result = await newAgent.clickElement({
        url: 'https://example.com',
        selector: 'button',
      });

      expect(result).toBeDefined();
      await newAgent.close();
    });
  });

  describe('Form Functionality', () => {
    it('should fill form', async () => {
      const result = await agent.fillForm({
        url: 'https://example.com/form',
        fields: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should auto-initialize before fill form', async () => {
      const newAgent = new Agent17();
      const result = await newAgent.fillForm({
        url: 'https://example.com/form',
        fields: { name: 'Test' },
      });

      expect(result).toBeDefined();
      await newAgent.close();
    });
  });

  describe('Extract Data Functionality', () => {
    it('should extract data from page', async () => {
      const result = await agent.extractData({
        url: 'https://example.com',
        selectors: {
          title: 'h1',
          description: 'p.description',
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should extract data with fallback selectors', async () => {
      const result = await agent.extractWithFallback(
        'https://example.com',
        {
          title: ['h1', '.title', '#page-title'],
          price: ['.price', 'span.cost', '#item-price'],
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate to URL', async () => {
      const result = await agent.navigate('https://example.com');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
      expect(result.title).toBe('Example Page');
    });
  });

  describe('Screenshot', () => {
    it('should take screenshot', async () => {
      const screenshot = await agent.screenshot('https://example.com');

      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it('should take full page screenshot', async () => {
      const screenshot = await agent.screenshot('https://example.com', {
        fullPage: true,
      });

      expect(screenshot).toBeInstanceOf(Buffer);
    });

    it('should save screenshot to path', async () => {
      const screenshot = await agent.screenshot('https://example.com', {
        path: '/tmp/test-screenshot.png',
      });

      expect(screenshot).toBeInstanceOf(Buffer);
    });
  });

  describe('Cleanup', () => {
    it('should close successfully', async () => {
      await agent.initialize();
      await expect(agent.close()).resolves.not.toThrow();
    });

    it('should allow reinitialization after close', async () => {
      await agent.initialize();
      await agent.close();
      await expect(agent.initialize()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in search', async () => {
      const chromium = require('playwright').chromium;
      const originalLaunch = chromium.launch;
      chromium.launch.mockRejectedValueOnce(new Error('Browser launch failed'));

      const errorAgent = new Agent17();
      await expect(errorAgent.search({ query: 'test' })).rejects.toThrow();

      chromium.launch = originalLaunch;
    });
  });

  describe('Configuration', () => {
    it('should work with headless mode enabled', () => {
      const headlessAgent = new Agent17({ headless: true });
      expect(headlessAgent).toBeInstanceOf(Agent17);
    });

    it('should work with headless mode disabled', () => {
      const headfulAgent = new Agent17({ headless: false });
      expect(headfulAgent).toBeInstanceOf(Agent17);
    });

    it('should accept different log levels', () => {
      const levels: Array<'info' | 'warn' | 'error' | 'debug'> = ['info', 'warn', 'error', 'debug'];
      
      levels.forEach(level => {
        const agent = new Agent17({ logLevel: level });
        expect(agent).toBeInstanceOf(Agent17);
      });
    });
  });
});
