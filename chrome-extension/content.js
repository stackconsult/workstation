/**
 * Workstation Chrome Extension - Content Script
 * Runs on all pages to enable action recording
 */

let isRecording = false;
let recordedActions = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    isRecording = true;
    recordedActions = [];
    console.log('⏺️ Recording started');
    sendResponse({ success: true });
  }
  
  if (request.action === 'stopRecording') {
    isRecording = false;
    console.log('⏹️ Recording stopped:', recordedActions);
    
    // Send recorded actions to background
    chrome.runtime.sendMessage({ 
      action: 'recordingComplete', 
      actions: recordedActions 
    });
    
    sendResponse({ success: true, count: recordedActions.length });
  }
  
  return true;
});

// Capture user interactions when recording
document.addEventListener('click', (e) => {
  if (isRecording) {
    const element = e.target;
    const selector = getElementSelector(element);
    const actionData = {
      agent_type: 'browser',
      action: 'click',
      parameters: { 
        selector,
        text: element.textContent?.trim().substring(0, 50) || ''
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    // Send to background immediately
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    // Visual feedback
    highlightElement(element);
  }
}, true);

document.addEventListener('input', (e) => {
  if (isRecording && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    const element = e.target;
    const selector = getElementSelector(element);
    const actionData = {
      agent_type: 'browser',
      action: 'type',
      parameters: { 
        selector, 
        text: element.value,
        type: element.type || 'text'
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    // Send to background
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    // Visual feedback
    highlightElement(element);
  }
});

// Capture navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (isRecording && currentUrl !== lastUrl) {
    const actionData = {
      agent_type: 'browser',
      action: 'navigate',
      parameters: { 
        url: currentUrl
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    lastUrl = currentUrl;
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Get a unique selector for an element
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function getElementSelector(element) {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Try name attribute
  if (element.name) {
    return `[name="${element.name}"]`;
  }
  
  // Try data-testid or data-test
  if (element.dataset.testid) {
    return `[data-testid="${element.dataset.testid}"]`;
  }
  
  if (element.dataset.test) {
    return `[data-test="${element.dataset.test}"]`;
  }
  
  // Try class if it's unique
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      const classSelector = `.${classes.join('.')}`;
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    }
  }
  
  // Fall back to nth-child
  return `${element.tagName.toLowerCase()}:nth-child(${getChildIndex(element)})`;
}

/**
 * Get the child index of an element
 * @param {HTMLElement} element - The element
 * @returns {number} Child index
 */
function getChildIndex(element) {
  let index = 1;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}

/**
 * Highlight an element temporarily to show it was recorded
 * @param {HTMLElement} element - The element to highlight
 */
function highlightElement(element) {
  const originalOutline = element.style.outline;
  const originalTransition = element.style.transition;
  
  element.style.transition = 'outline 0.3s ease';
  element.style.outline = '2px solid #4CAF50';
  
  setTimeout(() => {
    element.style.outline = originalOutline;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 300);
  }, 500);
}
