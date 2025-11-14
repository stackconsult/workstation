import React, { useState, useEffect, useRef } from 'react';
import { ConversationMessage, Task } from '@/types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Listen for task updates
    const handleMessage = (message: any) => {
      if (message.type === 'TASK_COMPLETE' || message.type === 'TASK_FAILED') {
        loadActiveTasks();
      } else if (message.type === 'ANALYZE_CONTENT') {
        // Handle content analysis request from context menu
        if (message.data.text) {
          handleSendMessage(`Analyze this text: ${message.data.text}`);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    loadActiveTasks();

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const loadActiveTasks = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TASKS' });
      if (response.tasks) {
        setActiveTasks(response.tasks);
      }
    } catch (error) {
      console.error('Error loading active tasks:', error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_COMMAND',
        command: text,
      });

      const agentMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.result?.plan || response.error || 'Task completed',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      loadActiveTasks();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>🤖 Unified Browser Agent</h1>
        <p className="subtitle">AI-Powered Browser Automation</p>
      </div>

      <div className="tasks-panel">
        <h3>Active Tasks ({activeTasks.length})</h3>
        {activeTasks.length > 0 ? (
          <div className="task-list">
            {activeTasks.map(task => (
              <div key={task.id} className="task-item">
                <span className={`status-badge status-${task.status}`}>
                  {task.status}
                </span>
                <span className="task-desc">{task.description}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tasks">No active tasks</p>
        )}
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>👋 Welcome!</h2>
            <p>I'm your unified browser agent. I can help you with:</p>
            <ul>
              <li>🔍 Navigating and analyzing web pages</li>
              <li>📊 Extracting and structuring data</li>
              <li>🤖 Automating repetitive tasks</li>
              <li>💡 Providing insights and analysis</li>
            </ul>
            <p>Just type a command below to get started!</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message message-${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '👤 You' : '🤖 Agent'}
                </span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          className="message-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me to do something... (Press Enter to send)"
          rows={3}
          disabled={isProcessing}
        />
        <button
          className="send-button"
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isProcessing}
        >
          {isProcessing ? '⏳' : '📤'} Send
        </button>
      </div>

      <div className="quick-actions">
        <button
          className="quick-action-btn"
          onClick={() => handleSendMessage('Extract all links from this page')}
          disabled={isProcessing}
        >
          📎 Extract Links
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleSendMessage('Summarize this page')}
          disabled={isProcessing}
        >
          📝 Summarize
        </button>
        <button
          className="quick-action-btn"
          onClick={() => handleSendMessage('Take a screenshot')}
          disabled={isProcessing}
        >
          📸 Screenshot
        </button>
      </div>
    </div>
  );
};

export default App;
