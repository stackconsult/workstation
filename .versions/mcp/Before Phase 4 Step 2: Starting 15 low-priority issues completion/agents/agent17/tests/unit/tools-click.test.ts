// Unit tests for click-element tool
import { clickElement } from '../../src/tools/click-element.js';
import { BrowserManager } from '../../src/browser/manager.js';
import type { ClickElementInput } from '../../src/types/index.js';
import type { Page } from 'playwright';

// Mock dependencies
jest.mock('../../src/browser/manager.js');
jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  setLogLevel: jest.fn(),
}));
jest.mock('../../src/utils/retry.js', () => ({
  withRetry: jest.fn((fn) => fn()), // Execute immediately without retry
}));

describe('Click Element Tool', () => {
  let mockManager: jest.Mocked<BrowserManager>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      locator: jest.fn().mockReturnValue({
        click: jest.fn().mockResolvedValue(undefined),
      }),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      url: jest.fn().mockReturnValue('https://example.com/clicked'),
      title: jest.fn().mockResolvedValue('Clicked Page Title'),
    } as any;

    mockManager = {
      getPage: jest.fn().mockResolvedValue(mockPage),
      releasePage: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe('clickElement', () => {
    it('should click element successfully', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      const result = await clickElement(mockManager, input);

      expect(result.success).toBe(true);
      expect(result.data.clicked).toBe('button#submit');
      expect(result.data.finalUrl).toBe('https://example.com/clicked');
      expect(result.data.pageTitle).toBe('Clicked Page Title');
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ waitUntil: 'networkidle' })
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'button#submit',
        expect.objectContaining({ state: 'visible' })
      );
    });

    it('should wait after click when specified', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
        waitAfterClick: 2000,
      };

      await clickElement(mockManager, input);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it('should not wait after click when not specified', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      await clickElement(mockManager, input);

      expect(mockPage.waitForTimeout).not.toHaveBeenCalled();
    });

    it('should release page after successful click', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      await clickElement(mockManager, input);

      expect(mockManager.releasePage).toHaveBeenCalledWith(mockPage);
    });

    it('should release page even if click fails', async () => {
      mockPage.locator.mockReturnValue({
        click: jest.fn().mockRejectedValue(new Error('Click failed')),
      } as any);

      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      await expect(clickElement(mockManager, input)).rejects.toThrow('Click failed');
      expect(mockManager.releasePage).toHaveBeenCalledWith(mockPage);
    });

    it('should include metadata in result', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      const result = await clickElement(mockManager, input);

      expect(result.metadata.url).toBe('https://example.com');
      expect(result.metadata.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle navigation errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      const input: ClickElementInput = {
        url: 'https://invalid-url.com',
        selector: 'button#submit',
      };

      await expect(clickElement(mockManager, input)).rejects.toThrow('Navigation failed');
    });

    it('should handle selector not found', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#nonexistent',
      };

      await expect(clickElement(mockManager, input)).rejects.toThrow('Selector not found');
    });

    it('should handle click failures', async () => {
      mockPage.locator.mockReturnValue({
        click: jest.fn().mockRejectedValue(new Error('Element not clickable')),
      } as any);

      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#disabled',
      };

      await expect(clickElement(mockManager, input)).rejects.toThrow('Element not clickable');
    });

    it('should work with different selector types', async () => {
      const selectors = [
        'button#submit',
        '.submit-button',
        '[data-testid="submit"]',
        'button[type="submit"]',
      ];

      for (const selector of selectors) {
        const input: ClickElementInput = {
          url: 'https://example.com',
          selector,
        };

        const result = await clickElement(mockManager, input);
        expect(result.success).toBe(true);
        expect(result.data.clicked).toBe(selector);
      }
    });

    it('should capture page state after click', async () => {
      mockPage.url.mockReturnValue('https://example.com/after-click');
      mockPage.title.mockResolvedValue('After Click Page');

      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      const result = await clickElement(mockManager, input);

      expect(result.data.finalUrl).toBe('https://example.com/after-click');
      expect(result.data.pageTitle).toBe('After Click Page');
    });

    it('should handle timeout in waitForSelector', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout waiting for selector'));

      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#slow-loading',
      };

      await expect(clickElement(mockManager, input)).rejects.toThrow('Timeout');
    });

    it('should wait for element to be visible', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
      };

      await clickElement(mockManager, input);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'button#submit',
        expect.objectContaining({ state: 'visible', timeout: 10000 })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long wait times', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button#submit',
        waitAfterClick: 60000, // 1 minute
      };

      await clickElement(mockManager, input);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(60000);
    });

    it('should handle special characters in selectors', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com',
        selector: 'button[data-action="submit:form"]',
      };

      const result = await clickElement(mockManager, input);
      expect(result.success).toBe(true);
    });

    it('should handle URLs with query parameters', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com?param1=value1&param2=value2',
        selector: 'button#submit',
      };

      const result = await clickElement(mockManager, input);
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com?param1=value1&param2=value2',
        expect.any(Object)
      );
    });

    it('should handle URLs with fragments', async () => {
      const input: ClickElementInput = {
        url: 'https://example.com#section',
        selector: 'button#submit',
      };

      const result = await clickElement(mockManager, input);
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com#section',
        expect.any(Object)
      );
    });
  });
});
