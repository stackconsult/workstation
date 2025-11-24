// Extract Data Tool for Agent #17
// Provides advanced data extraction from web pages

import { BrowserManager } from '../browser/manager.js';
import { ExtractDataInput, ToolResult } from '../types/index.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';

export async function extractData(
  manager: BrowserManager,
  input: ExtractDataInput
): Promise<ToolResult> {
  const startTime = Date.now();
  
  return await withRetry(async () => {
    const page = await manager.getPage();
    
    try {
      log('info', 'Extracting data', { url: input.url, selectors: Object.keys(input.selectors).length });
      
      await page.goto(input.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Extract data based on selectors
      const extractedData: Record<string, any> = {};
      
      for (const [key, selector] of Object.entries(input.selectors)) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          
          if (count === 0) {
            log('warn', 'Selector not found', { key, selector });
            extractedData[key] = null;
            continue;
          }
          
          // Extract single or multiple elements
          if (input.extractMultiple?.[key]) {
            // Extract all matching elements
            const values = await elements.evaluateAll(els => 
              els.map(el => el.textContent?.trim() || '')
            );
            extractedData[key] = values;
          } else {
            // Extract first matching element
            const value = await elements.first().textContent();
            extractedData[key] = value?.trim() || null;
          }
          
          log('info', 'Extracted data', { key, valueLength: String(extractedData[key]).length });
        } catch (error) {
          log('error', 'Failed to extract data for selector', { key, selector, error });
          extractedData[key] = null;
        }
      }
      
      // Take screenshot if requested
      let screenshot: Buffer | null = null;
      if (input.takeScreenshot) {
        screenshot = await manager.screenshot(page, { 
          fullPage: input.fullPageScreenshot 
        });
        log('info', 'Screenshot captured');
      }

      return {
        success: true,
        data: {
          url: input.url,
          extracted: extractedData,
          screenshotSize: screenshot ? screenshot.length : 0,
        },
        metadata: {
          url: input.url,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      log('error', 'Data extraction failed', { error });
      throw error;
    } finally {
      await manager.releasePage(page);
    }
  }, 3, 1000);
}

/**
 * Extract structured data using multiple selector strategies
 */
export async function extractWithFallback(
  manager: BrowserManager,
  url: string,
  selectorStrategies: Record<string, string[]>
): Promise<ToolResult> {
  const startTime = Date.now();
  const page = await manager.getPage();
  
  try {
    log('info', 'Extracting with fallback strategies', { url });
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const extractedData: Record<string, any> = {};
    
    for (const [key, selectors] of Object.entries(selectorStrategies)) {
      let extracted = false;
      
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          const count = await element.count();
          
          if (count > 0) {
            const value = await element.first().textContent();
            extractedData[key] = value?.trim() || null;
            extracted = true;
            log('info', 'Extracted with selector', { key, selector });
            break;
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }
      
      if (!extracted) {
        log('warn', 'No selector worked for key', { key });
        extractedData[key] = null;
      }
    }

    return {
      success: true,
      data: {
        url,
        extracted: extractedData,
      },
      metadata: {
        url,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
    };
  } catch (error) {
    log('error', 'Extraction with fallback failed', { error });
    throw error;
  } finally {
    await manager.releasePage(page);
  }
}
