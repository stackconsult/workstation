import { BrowserAction, PageElement, ExtractionResult } from '@/types';

export class BrowserAutomation {
  /**
   * Execute a browser action on the current page
   */
  static async executeAction(action: BrowserAction): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'EXECUTE_ACTION', action },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });
    });
  }

  /**
   * Navigate to a URL
   */
  static async navigate(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        chrome.tabs.update(tabs[0].id, { url }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // Wait for page to load
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tabs[0].id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            });
          }
        });
      });
    });
  }

  /**
   * Extract elements from the current page
   */
  static async extractElements(selector?: string): Promise<PageElement[]> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'EXTRACT_ELEMENTS', selector },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response.elements || []);
            }
          }
        );
      });
    });
  }

  /**
   * Get page content
   */
  static async getPageContent(): Promise<ExtractionResult> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'GET_PAGE_CONTENT' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });
    });
  }

  /**
   * Take a screenshot of the current page
   */
  static async takeScreenshot(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(dataUrl);
        }
      });
    });
  }

  /**
   * Click on an element
   */
  static async click(selector: string): Promise<void> {
    return this.executeAction({
      type: 'click',
      selector,
    });
  }

  /**
   * Type text into an element
   */
  static async type(selector: string, text: string): Promise<void> {
    return this.executeAction({
      type: 'type',
      selector,
      value: text,
    });
  }

  /**
   * Scroll the page
   */
  static async scroll(options: { x?: number; y?: number }): Promise<void> {
    return this.executeAction({
      type: 'scroll',
      options,
    });
  }

  /**
   * Wait for an element to appear
   */
  static async waitForElement(
    selector: string,
    timeout: number = 5000
  ): Promise<boolean> {
    return this.executeAction({
      type: 'wait',
      selector,
      options: { timeout },
    });
  }

  /**
   * Get current page URL
   */
  static async getCurrentUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.url) {
          reject(new Error('No active tab found'));
          return;
        }
        resolve(tabs[0].url);
      });
    });
  }

  /**
   * Get page title
   */
  static async getPageTitle(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.title) {
          reject(new Error('No active tab found'));
          return;
        }
        resolve(tabs[0].title);
      });
    });
  }

  /**
   * Execute custom JavaScript on the page
   */
  static async executeScript(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: new Function(code) as () => any,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(results?.[0]?.result);
            }
          }
        );
      });
    });
  }
}
