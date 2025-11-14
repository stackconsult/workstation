import { getOrchestrator, initializeOrchestrator } from '@/agents/orchestrator';
import { LLMProvider, UserSettings } from '@/types';

// Background service worker

console.log('Unified Browser Agent background script loaded');

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  const defaultSettings: UserSettings = {
    llmConfigs: {},
    defaultProvider: LLMProvider.OPENAI,
    privacyMode: 'cloud-allowed',
    autoExecute: false,
    confirmActions: true,
  };
  
  await chrome.storage.local.set({ settings: defaultSettings });
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'unified-agent-analyze',
    title: 'Analyze with Agent',
    contexts: ['page', 'selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'unified-agent-analyze' && tab?.id) {
    // Open side panel
    await chrome.sidePanel.open({ tabId: tab.id });
    
    // Send selected text or page info to side panel
    const message = {
      type: 'ANALYZE_CONTENT',
      data: {
        text: info.selectionText,
        url: info.pageUrl,
      },
    };
    
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be ready yet
    });
  }
});

// Handle messages from content scripts and UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings().then(sendResponse);
      return true;
    
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings).then(sendResponse);
      return true;
    
    case 'SUBMIT_TASK':
      handleSubmitTask(message.task).then(sendResponse);
      return true;
    
    case 'GET_TASK_STATUS':
      handleGetTaskStatus(message.taskId).then(sendResponse);
      return true;
    
    case 'PROCESS_COMMAND':
      handleProcessCommand(message.command, message.context).then(sendResponse);
      return true;
    
    case 'GET_ACTIVE_TASKS':
      handleGetActiveTasks().then(sendResponse);
      return true;
    
    case 'CONTENT_SCRIPT_READY':
      // Content script is ready, no response needed
      return false;
    
    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

async function handleGetSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get('settings');
  return result.settings || {};
}

async function handleUpdateSettings(settings: UserSettings): Promise<{ success: boolean }> {
  await chrome.storage.local.set({ settings });
  
  // Update orchestrator with new LLM config
  if (settings.llmConfigs[settings.defaultProvider]) {
    const orchestrator = getOrchestrator();
    orchestrator.updateLLMConfig(settings.llmConfigs[settings.defaultProvider]);
  }
  
  return { success: true };
}

async function handleSubmitTask(task: any): Promise<{ taskId: string }> {
  const settings = await handleGetSettings();
  
  // Initialize orchestrator with LLM config if not already done
  let orchestrator = getOrchestrator();
  if (settings.llmConfigs[settings.defaultProvider]) {
    orchestrator = initializeOrchestrator(settings.llmConfigs[settings.defaultProvider]);
  }
  
  const taskId = await orchestrator.submitTask(task);
  return { taskId };
}

async function handleGetTaskStatus(taskId: string): Promise<any> {
  const orchestrator = getOrchestrator();
  const task = orchestrator.getTask(taskId);
  
  if (!task) {
    return { error: 'Task not found' };
  }
  
  return { task };
}

async function handleProcessCommand(command: string, context?: any): Promise<any> {
  const settings = await handleGetSettings();
  
  // Initialize orchestrator with LLM config
  let orchestrator = getOrchestrator();
  if (settings.llmConfigs[settings.defaultProvider]) {
    orchestrator = initializeOrchestrator(settings.llmConfigs[settings.defaultProvider]);
  }
  
  try {
    const result = await orchestrator.processCommand(command, context);
    return { result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function handleGetActiveTasks(): Promise<{ tasks: any[] }> {
  const orchestrator = getOrchestrator();
  const tasks = orchestrator.getActiveTasks();
  return { tasks };
}

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Content script is automatically injected via manifest
  }
});

// Keep service worker alive
let keepAliveInterval: NodeJS.Timeout | null = null;

function startKeepAlive() {
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(() => {
      chrome.runtime.getPlatformInfo(() => {
        // Just to keep the service worker alive
      });
    }, 20000); // Every 20 seconds
  }
}

startKeepAlive();

export {};
