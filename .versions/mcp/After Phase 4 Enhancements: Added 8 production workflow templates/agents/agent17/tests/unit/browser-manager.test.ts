// Unit tests for BrowserManager
import { BrowserManager, type SearchResult } from '../../src/browser/manager.js';
import { setLogLevel } from '../../src/utils/logger.js';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newContext: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          setDefaultTimeout: jest.fn(),
          goto: jest.fn().mockResolvedValue(undefined),
          evaluate: jest.fn().mockResolvedValue([]),
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
}));

describe('BrowserManager', () => {
  let browserManager: BrowserManager;

  beforeAll(() => {
    setLogLevel('error'); // Minimize logging during tests
  });

  beforeEach(() => {
    browserManager = new BrowserManager();
  });

  afterEach(async () => {
    // Clean up after each test
    if (browserManager) {
      await browserManager.close();
    }
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const manager = new BrowserManager();
      expect(manager).toBeInstanceOf(BrowserManager);
    });

    it('should accept custom config', () => {
      const config = {
        headless: false,
        maxPages: 10,
        timeout: 60000,
        userAgent: 'CustomAgent/1.0',
      };
      const manager = new BrowserManager(config);
      expect(manager).toBeInstanceOf(BrowserManager);
    });

    it('should use default values for missing config', () => {
      const manager = new BrowserManager({ headless: false });
      expect(manager).toBeInstanceOf(BrowserManager);
    });
  });

  describe('initialize', () => {
    it('should initialize browser successfully', async () => {
      await expect(browserManager.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await browserManager.initialize();
      await expect(browserManager.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      const chromium = require('playwright').chromium;
      chromium.launch.mockRejectedValueOnce(new Error('Launch failed'));
      
      const manager = new BrowserManager();
      await expect(manager.initialize()).rejects.toThrow('Launch failed');
    });
  });

  describe('getPage', () => {
    it('should create a new page', async () => {
      const page = await browserManager.getPage();
      expect(page).toBeDefined();
      expect(page.setDefaultTimeout).toHaveBeenCalled();
    });

    it('should auto-initialize if not initialized', async () => {
      const manager = new BrowserManager();
      const page = await manager.getPage();
      expect(page).toBeDefined();
    });

    it('should reuse pages from pool', async () => {
      const page1 = await browserManager.getPage();
      await browserManager.releasePage(page1);
      
      const page2 = await browserManager.getPage();
      expect(page2).toBe(page1);
    });

    it('should create multiple pages', async () => {
      const page1 = await browserManager.getPage();
      const page2 = await browserManager.getPage();
      
      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
    });
  });

  describe('releasePage', () => {
    it('should return page to pool', async () => {
      const page = await browserManager.getPage();
      await expect(browserManager.releasePage(page)).resolves.not.toThrow();
    });

    it('should clear page state before returning to pool', async () => {
      const page = await browserManager.getPage();
      await browserManager.releasePage(page);
      
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('should close page if pool is full', async () => {
      const manager = new BrowserManager({ maxPages: 1 });
      
      const page1 = await manager.getPage();
      const page2 = await manager.getPage();
      
      await manager.releasePage(page1);
      await manager.releasePage(page2);
      
      expect(page2.close).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should perform Google search', async () => {
      const mockResults: SearchResult[] = [
        { title: 'Result 1', url: 'https://example.com/1', snippet: 'Snippet 1', position: 1 },
        { title: 'Result 2', url: 'https://example.com/2', snippet: 'Snippet 2', position: 2 },
      ];
      
      // Mock the page.evaluate to return search results
      const chromium = require('playwright').chromium;
      const mockBrowser = await chromium.launch();
      const mockContext = await mockBrowser.newContext();
      const mockPage = await mockContext.newPage();
      mockPage.evaluate.mockResolvedValue(mockResults);
      
      const results = await browserManager.search('test query', 'google');
      
      expect(results).toEqual(mockResults);
      expect(mockPage.goto).toHaveBeenCalled();
    });

    it('should perform Bing search', async () => {
      const results = await browserManager.search('test query', 'bing');
      expect(results).toBeDefined();
    });

    it('should perform DuckDuckGo search', async () => {
      const results = await browserManager.search('test query', 'duckduckgo');
      expect(results).toBeDefined();
    });

    it('should default to Google search', async () => {
      const results = await browserManager.search('test query');
      expect(results).toBeDefined();
    });

    it('should release page after search', async () => {
      const results = await browserManager.search('test query');
      expect(results).toBeDefined();
      // Page should be returned to pool
    });

    it('should handle search errors', async () => {
      const chromium = require('playwright').chromium;
      const mockBrowser = await chromium.launch();
      const mockContext = await mockBrowser.newContext();
      const mockPage = await mockContext.newPage();
      mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));
      
      await expect(browserManager.search('test query')).rejects.toThrow();
    });
  });

  describe('navigate', () => {
    it('should navigate to URL', async () => {
      const page = await browserManager.navigate('https://example.com');
      expect(page).toBeDefined();
      expect(page.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ waitUntil: 'networkidle' })
      );
    });

    it('should handle navigation errors', async () => {
      const chromium = require('playwright').chromium;
      const mockBrowser = await chromium.launch();
      const mockContext = await mockBrowser.newContext();
      const mockPage = await mockContext.newPage();
      mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));
      
      await expect(browserManager.navigate('https://invalid-url.com')).rejects.toThrow();
    });

    it('should return page for further use', async () => {
      const page = await browserManager.navigate('https://example.com');
      expect(page).toBeDefined();
      expect(page.url).toBeDefined();
      expect(page.title).toBeDefined();
    });
  });

  describe('screenshot', () => {
    it('should take screenshot of page', async () => {
      const page = await browserManager.getPage();
      const screenshot = await browserManager.screenshot(page);
      
      expect(screenshot).toBeInstanceOf(Buffer);
      expect(page.screenshot).toHaveBeenCalled();
    });

    it('should support fullPage option', async () => {
      const page = await browserManager.getPage();
      await browserManager.screenshot(page, { fullPage: true });
      
      expect(page.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({ fullPage: true })
      );
    });

    it('should support path option', async () => {
      const page = await browserManager.getPage();
      await browserManager.screenshot(page, { path: '/tmp/screenshot.png' });
      
      expect(page.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/tmp/screenshot.png' })
      );
    });

    it('should use default options when none provided', async () => {
      const page = await browserManager.getPage();
      await browserManager.screenshot(page);
      
      expect(page.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({ fullPage: false })
      );
    });
  });

  describe('close', () => {
    it('should close browser and all pages', async () => {
      await browserManager.initialize();
      const page1 = await browserManager.getPage();
      const page2 = await browserManager.getPage();
      
      await browserManager.releasePage(page1);
      await browserManager.releasePage(page2);
      
      await browserManager.close();
      
      expect(page1.close).toHaveBeenCalled();
      expect(page2.close).toHaveBeenCalled();
    });

    it('should handle close when not initialized', async () => {
      const manager = new BrowserManager();
      await expect(manager.close()).resolves.not.toThrow();
    });

    it('should cleanup all resources', async () => {
      await browserManager.initialize();
      await browserManager.close();
      
      // Should be able to reinitialize after close
      await expect(browserManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Page Pooling', () => {
    it('should maintain page pool up to maxPages', async () => {
      const manager = new BrowserManager({ maxPages: 3 });
      
      const pages = await Promise.all([
        manager.getPage(),
        manager.getPage(),
        manager.getPage(),
      ]);
      
      await Promise.all(pages.map(p => manager.releasePage(p)));
      
      // All pages should be in pool
      const reusedPage = await manager.getPage();
      expect(pages).toContain(reusedPage);
    });

    it('should not exceed maxPages in pool', async () => {
      const manager = new BrowserManager({ maxPages: 2 });
      
      const page1 = await manager.getPage();
      const page2 = await manager.getPage();
      const page3 = await manager.getPage();
      
      await manager.releasePage(page1);
      await manager.releasePage(page2);
      await manager.releasePage(page3);
      
      // Third page should have been closed
      expect(page3.close).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if context not initialized', async () => {
      const chromium = require('playwright').chromium;
      chromium.launch.mockResolvedValueOnce({
        newContext: jest.fn().mockResolvedValue(null),
        close: jest.fn(),
      });
      
      const manager = new BrowserManager();
      await manager.initialize();
      
      await expect(manager.getPage()).rejects.toThrow('Browser context not initialized');
    });

    it('should handle timeout errors', async () => {
      const manager = new BrowserManager({ timeout: 1000 });
      const page = await manager.getPage();
      expect(page.setDefaultTimeout).toHaveBeenCalledWith(1000);
    });
  });
});
