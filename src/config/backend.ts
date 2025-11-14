/**
 * Backend configuration management
 */

export interface BackendSettings {
  enabled: boolean;
  url: string;
  timeout: number;
  autoConnect: boolean;
}

const DEFAULT_SETTINGS: BackendSettings = {
  enabled: false,
  url: 'http://localhost:8000',
  timeout: 30000,
  autoConnect: false,
};

const STORAGE_KEY = 'backend_settings';

/**
 * Load backend settings from Chrome storage
 */
export async function loadBackendSettings(): Promise<BackendSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load backend settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save backend settings to Chrome storage
 */
export async function saveBackendSettings(
  settings: Partial<BackendSettings>
): Promise<void> {
  try {
    const current = await loadBackendSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  } catch (error) {
    console.error('Failed to save backend settings:', error);
    throw error;
  }
}

/**
 * Reset backend settings to defaults
 */
export async function resetBackendSettings(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  } catch (error) {
    console.error('Failed to reset backend settings:', error);
    throw error;
  }
}
