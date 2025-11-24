// Click Element Tool for Agent #17
// Provides browser automation capability to click on elements

import { BrowserManager } from '../browser/manager.js';
import { ClickElementInput, ToolResult } from '../types/index.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';

export async function clickElement(
  manager: BrowserManager,
  input: ClickElementInput
): Promise<ToolResult> {
  const startTime = Date.now();
  
  return await withRetry(async () => {
    const page = await manager.getPage();
    
    try {
      log('info', 'Clicking element', { url: input.url, selector: input.selector });
      
      await page.goto(input.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for element to be visible and enabled
      await page.waitForSelector(input.selector, { state: 'visible', timeout: 10000 });
      
      // Click the element
      await page.locator(input.selector).click();
      
      // Wait after click if specified
      if (input.waitAfterClick) {
        await page.waitForTimeout(input.waitAfterClick);
      }

      const finalUrl = page.url();
      const title = await page.title();

      return {
        success: true,
        data: {
          clicked: input.selector,
          finalUrl,
          pageTitle: title,
        },
        metadata: {
          url: input.url,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      log('error', 'Failed to click element', { error, selector: input.selector });
      throw error;
    } finally {
      await manager.releasePage(page);
    }
  }, 3, 1000);
}
