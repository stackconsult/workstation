import { BrowserAction, PageElement } from '@/types';

// Content script - runs in the context of web pages

interface Message {
  type: string;
  action?: BrowserAction;
  selector?: string;
  [key: string]: any;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case 'EXECUTE_ACTION':
      handleExecuteAction(message.action!).then(sendResponse).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true; // Keep channel open for async response

    case 'EXTRACT_ELEMENTS':
      handleExtractElements(message.selector).then(sendResponse).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;

    case 'GET_PAGE_CONTENT':
      handleGetPageContent().then(sendResponse).catch((error) => {
        sendResponse({ error: error.message });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleExecuteAction(action: BrowserAction): Promise<any> {
  switch (action.type) {
    case 'click':
      return executeClick(action.selector!);
    
    case 'type':
      return executeType(action.selector!, action.value!);
    
    case 'scroll':
      return executeScroll(action.options);
    
    case 'wait':
      return executeWait(action.selector!, action.options?.timeout || 5000);
    
    case 'extract':
      return executeExtract(action.selector!);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

function executeClick(selector: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      reject(new Error(`Element not found: ${selector}`));
      return;
    }
    
    element.click();
    resolve();
  });
}

function executeType(selector: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!element) {
      reject(new Error(`Element not found: ${selector}`));
      return;
    }
    
    element.focus();
    element.value = text;
    
    // Trigger input events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    resolve();
  });
}

function executeScroll(options?: { x?: number; y?: number }): Promise<void> {
  return new Promise((resolve) => {
    window.scrollTo({
      left: options?.x || 0,
      top: options?.y || 0,
      behavior: 'smooth',
    });
    
    setTimeout(resolve, 500); // Wait for scroll to complete
  });
}

function executeWait(selector: string, timeout: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

function executeExtract(selector: string): Promise<PageElement[]> {
  const elements = document.querySelectorAll(selector);
  return Promise.resolve(
    Array.from(elements).map(el => elementToPageElement(el as HTMLElement))
  );
}

function handleExtractElements(selector?: string): Promise<{ elements: PageElement[] }> {
  const query = selector || '*';
  const elements = document.querySelectorAll(query);
  
  const pageElements = Array.from(elements)
    .slice(0, 100) // Limit to first 100 elements
    .map(el => elementToPageElement(el as HTMLElement));
  
  return Promise.resolve({ elements: pageElements });
}

function handleGetPageContent(): Promise<any> {
  const elements = document.querySelectorAll('body *');
  const pageElements = Array.from(elements)
    .slice(0, 100)
    .map(el => elementToPageElement(el as HTMLElement));
  
  return Promise.resolve({
    elements: pageElements,
    text: document.body.innerText,
    html: document.body.innerHTML.substring(0, 10000), // Limit HTML length
    metadata: {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
    },
  });
}

function elementToPageElement(element: HTMLElement): PageElement {
  const rect = element.getBoundingClientRect();
  const attributes: Record<string, string> = {};
  
  Array.from(element.attributes).forEach(attr => {
    attributes[attr.name] = attr.value;
  });
  
  // Generate a selector for the element
  let selector = element.tagName.toLowerCase();
  if (element.id) {
    selector = `#${element.id}`;
  } else if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += `.${classes.join('.')}`;
    }
  }
  
  return {
    selector,
    tagName: element.tagName.toLowerCase(),
    text: element.textContent?.substring(0, 200) || undefined,
    value: (element as HTMLInputElement).value || undefined,
    attributes,
    boundingBox: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
  };
}

// Notify background that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => {
  // Ignore errors if background script is not ready
});

console.log('Unified Browser Agent content script loaded');
