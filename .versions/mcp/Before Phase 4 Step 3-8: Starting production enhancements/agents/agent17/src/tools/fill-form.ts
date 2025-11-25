// Fill Form Tool for Agent #17
// Provides browser automation capability to fill out forms

import { BrowserManager } from '../browser/manager.js';
import { FillFormInput, ToolResult } from '../types/index.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';

export async function fillForm(
  manager: BrowserManager,
  input: FillFormInput
): Promise<ToolResult> {
  const startTime = Date.now();
  
  return await withRetry(async () => {
    const page = await manager.getPage();
    
    try {
      log('info', 'Filling form', { url: input.url, fields: Object.keys(input.fields).length });
      
      await page.goto(input.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Fill each field
      for (const [selector, value] of Object.entries(input.fields)) {
        log('info', 'Filling field', { selector });
        
        await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        
        const element = page.locator(selector);
        
        // Determine field type and fill accordingly
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const inputType = await element.evaluate(el => 
          el.tagName.toLowerCase() === 'input' ? (el as HTMLInputElement).type : null
        );
        
        if (tagName === 'select') {
          await element.selectOption(String(value));
        } else if (inputType === 'checkbox' || inputType === 'radio') {
          if (value === 'true' || value === true) {
            await element.check();
          } else {
            await element.uncheck();
          }
        } else {
          // Text input, textarea, etc.
          await element.fill(String(value));
        }
        
        // Small delay between fields
        await page.waitForTimeout(100);
      }
      
      // Submit form if selector provided
      if (input.submitSelector) {
        log('info', 'Submitting form', { submitSelector: input.submitSelector });
        await page.locator(input.submitSelector).click();
        
        // Wait for navigation after submit
        await page.waitForTimeout(input.waitAfterSubmit || 2000);
      }

      const finalUrl = page.url();
      const title = await page.title();

      return {
        success: true,
        data: {
          fieldsFilledCount: Object.keys(input.fields).length,
          submitted: !!input.submitSelector,
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
      log('error', 'Failed to fill form', { error });
      throw error;
    } finally {
      await manager.releasePage(page);
    }
  }, 3, 1000);
}
