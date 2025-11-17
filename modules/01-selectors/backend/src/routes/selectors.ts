import express, { Request, Response, Router } from 'express';
import { chromium, Browser } from 'playwright';

const router: Router = express.Router();
let browser: Browser | null = null;

// Lazy browser initialization
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

/**
 * POST /api/selectors/generate
 * Generate CSS selector for an element on a webpage
 */
router.post('/generate', async (req: Request, res: Response) => {
  const { url, targetText, targetAttribute } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    let element;
    if (targetText) {
      element = page.locator(`text="${targetText}"`).first();
    } else if (targetAttribute) {
      element = page.locator(
        `[${targetAttribute.name}="${targetAttribute.value}"]`
      ).first();
    } else {
      await page.close();
      return res.status(400).json({
        message: 'Either targetText or targetAttribute must be provided',
      });
    }

    // Generate selector
    const selector = await element.evaluate((el) => {
      if (el.id) {
        return `#${el.id}`;
      }

      const path: string[] = [];
      let current: Element | null = el;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let selector = current.nodeName.toLowerCase();

        if (current.classList.length > 0) {
          selector += '.' + Array.from(current.classList).join('.');
        }

        if (current.parentNode) {
          const siblings = Array.from(current.parentNode.children);
          const sameType = siblings.filter((s) => s.nodeName === current!.nodeName);
          if (sameType.length > 1) {
            const index = sameType.indexOf(current as Element) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }

        path.unshift(selector);

        if (current.id) {
          break;
        }

        current = current.parentElement;
      }

      return path.join(' > ');
    });

    await page.close();

    res.json({
      selector,
      confidence: 0.9,
      method: targetText ? 'text-match' : 'attribute-match',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to generate selector',
      error: error.message,
    });
  }
});

/**
 * POST /api/selectors/validate
 * Validate a CSS selector on a webpage
 */
router.post('/validate', async (req: Request, res: Response) => {
  const { url, selector } = req.body;

  if (!url || !selector) {
    return res.status(400).json({ message: 'URL and selector are required' });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const elements = page.locator(selector);
    const count = await elements.count();
    const valid = count > 0;

    let sampleText = '';
    if (valid) {
      sampleText = (await elements.first().textContent()) || '';
    }

    await page.close();

    res.json({
      valid,
      matchCount: count,
      sampleText: sampleText.substring(0, 100),
      selector,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to validate selector',
      error: error.message,
    });
  }
});

/**
 * POST /api/selectors/optimize
 * Optimize a CSS selector
 */
router.post('/optimize', async (req: Request, res: Response) => {
  const { url, selector } = req.body;

  if (!url || !selector) {
    return res.status(400).json({ message: 'URL and selector are required' });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const element = page.locator(selector).first();
    const count = await page.locator(selector).count();

    if (count === 0) {
      await page.close();
      return res.status(404).json({ message: 'Selector does not match any elements' });
    }

    const optimized = await element.evaluate((el) => {
      if (el.id) {
        return `#${el.id}`;
      }

      const testId = el.getAttribute('data-testid');
      if (testId) {
        return `[data-testid="${testId}"]`;
      }

      if (el.classList.length > 0) {
        const classes = Array.from(el.classList).slice(0, 2).join('.');
        return el.nodeName.toLowerCase() + '.' + classes;
      }

      const siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
      const sameType = siblings.filter((s) => s.nodeName === el.nodeName);
      const index = sameType.indexOf(el) + 1;
      return `${el.nodeName.toLowerCase()}:nth-of-type(${index})`;
    });

    await page.close();

    res.json({
      original: selector,
      optimized,
      improvement: selector.length - optimized.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to optimize selector',
      error: error.message,
    });
  }
});

/**
 * POST /api/selectors/extract
 * Extract data using a CSS selector
 */
router.post('/extract', async (req: Request, res: Response) => {
  const { url, selector, extractType, attributeName } = req.body;

  if (!url || !selector || !extractType) {
    return res.status(400).json({
      message: 'URL, selector, and extractType are required',
    });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const elements = page.locator(selector);
    const count = await elements.count();

    if (count === 0) {
      await page.close();
      return res.status(404).json({ message: 'Selector does not match any elements' });
    }

    const results: any[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = elements.nth(i);
      let value = '';

      switch (extractType) {
        case 'text':
          value = (await element.textContent()) || '';
          break;
        case 'html':
          value = await element.innerHTML();
          break;
        case 'attribute':
          if (!attributeName) {
            await page.close();
            return res.status(400).json({
              message: 'attributeName required for attribute extraction',
            });
          }
          value = (await element.getAttribute(attributeName)) || '';
          break;
      }

      results.push(value);
    }

    await page.close();

    res.json({
      selector,
      extractType,
      matchCount: count,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to extract data',
      error: error.message,
    });
  }
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

export default router;
