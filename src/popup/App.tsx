import React, { useState, useEffect } from 'react';
import { UserSettings, LLMProvider } from '@/types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(LLMProvider.OPENAI);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    setSettings(response);
  };

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      defaultProvider: selectedProvider,
      llmConfigs: {
        ...settings.llmConfigs,
        [selectedProvider]: {
          provider: selectedProvider,
          apiKey,
          model: getDefaultModel(selectedProvider),
        },
      },
    };

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: updatedSettings,
    });

    setSettings(updatedSettings);
    setShowSettings(false);
  };

  const getDefaultModel = (provider: LLMProvider): string => {
    const models: Record<LLMProvider, string> = {
      [LLMProvider.OPENAI]: 'gpt-4',
      [LLMProvider.ANTHROPIC]: 'claude-3-sonnet-20240229',
      [LLMProvider.GEMINI]: 'gemini-pro',
      [LLMProvider.GROQ]: 'mixtral-8x7b-32768',
      [LLMProvider.OLLAMA]: 'llama2',
      [LLMProvider.CUSTOM]: 'custom-model',
    };
    return models[provider];
  };

  if (!settings) {
    return <div className="popup-loading">Loading...</div>;
  }

  if (showSettings) {
    return (
      <div className="popup-container settings-view">
        <div className="popup-header">
          <button className="back-button" onClick={() => setShowSettings(false)}>
            ← Back
          </button>
          <h2>Settings</h2>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label>LLM Provider</label>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as LLMProvider)}
            >
              <option value={LLMProvider.OPENAI}>OpenAI</option>
              <option value={LLMProvider.ANTHROPIC}>Anthropic Claude</option>
              <option value={LLMProvider.GEMINI}>Google Gemini</option>
              <option value={LLMProvider.GROQ}>Groq</option>
              <option value={LLMProvider.OLLAMA}>Ollama (Local)</option>
            </select>
          </div>

          <div className="setting-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={
                selectedProvider === LLMProvider.OLLAMA
                  ? 'Not required for local models'
                  : 'Enter your API key'
              }
              disabled={selectedProvider === LLMProvider.OLLAMA}
            />
            <small>Your API key is stored locally and never shared.</small>
          </div>

          <div className="setting-group">
            <label>Privacy Mode</label>
            <select
              value={settings.privacyMode}
              onChange={e =>
                setSettings({
                  ...settings,
                  privacyMode: e.target.value as 'local-only' | 'cloud-allowed',
                })
              }
            >
              <option value="cloud-allowed">Cloud Allowed</option>
              <option value="local-only">Local Only</option>
            </select>
            <small>
              Local Only mode prevents any data from being sent to cloud services.
            </small>
          </div>

          <button className="save-button" onClick={saveSettings}>
            Save Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>🤖 Unified Browser Agent</h1>
      </div>

      <div className="popup-content">
        <button className="action-button primary" onClick={openSidePanel}>
          <span className="button-icon">💬</span>
          <div className="button-text">
            <strong>Open Agent Chat</strong>
            <small>Start a conversation with your AI agent</small>
          </div>
        </button>

        <button className="action-button" onClick={() => setShowSettings(true)}>
          <span className="button-icon">⚙️</span>
          <div className="button-text">
            <strong>Settings</strong>
            <small>Configure LLM providers and preferences</small>
          </div>
        </button>

        <div className="status-section">
          <h3>Status</h3>
          <div className="status-item">
            <span className="status-label">Provider:</span>
            <span className="status-value">
              {settings.defaultProvider}
              {settings.llmConfigs[settings.defaultProvider] ? ' ✓' : ' ⚠️'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Privacy Mode:</span>
            <span className="status-value">{settings.privacyMode}</span>
          </div>
        </div>

        <div className="quick-tips">
          <h3>Quick Tips</h3>
          <ul>
            <li>Right-click on any page to analyze content</li>
            <li>Use natural language commands in the chat</li>
            <li>Configure your LLM provider in settings</li>
          </ul>
        </div>
      </div>

      <div className="popup-footer">
        <small>Version 1.0.0 | Privacy-First AI Automation</small>
      </div>
    </div>
  );
};

export default App;
