# Installation Guide

## Requirements

- Node.js v20.x or higher
- npm or pnpm
- Chrome or Chromium-based browser (Chrome, Edge, Brave, etc.)

## Installation from Source

### 1. Clone the Repository

```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- TypeScript
- React and React DOM
- Vite (build tool)
- Chrome extension types
- Sharp (for icon generation)

### 3. Build the Extension

```bash
npm run build
```

This command will:
1. Generate extension icons
2. Compile TypeScript code
3. Bundle React components
4. Copy manifest and assets to `dist/`

The build output will be in the `dist/` directory.

### 4. Load the Extension in Chrome

#### Step-by-Step:

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable **Developer mode** (toggle in the top-right corner)

3. Click **"Load unpacked"**

4. Select the `dist` folder from your project directory

5. The extension icon should appear in your browser toolbar

#### Verification:

- You should see "Unified Browser Agent" in your extensions list
- Click the extension icon to open the popup
- Click "Open Agent Chat" to open the sidepanel

## Configuration

### First-Time Setup

1. **Click the extension icon** in your toolbar

2. **Go to Settings**

3. **Configure your LLM provider:**
   
   #### For OpenAI:
   - Select "OpenAI" as provider
   - Enter your OpenAI API key
   - Default model: gpt-4

   #### For Anthropic Claude:
   - Select "Anthropic Claude" as provider
   - Enter your Anthropic API key
   - Default model: claude-3-sonnet-20240229

   #### For Google Gemini:
   - Select "Google Gemini" as provider
   - Enter your Google AI API key
   - Default model: gemini-pro

   #### For Groq:
   - Select "Groq" as provider
   - Enter your Groq API key
   - Default model: mixtral-8x7b-32768

   #### For Ollama (Local):
   - Select "Ollama (Local)" as provider
   - No API key required
   - Make sure Ollama is running locally
   - Default model: llama2

4. **Choose Privacy Mode:**
   - **Cloud Allowed**: LLM requests can be sent to cloud providers
   - **Local Only**: All processing happens locally (requires Ollama)

5. **Click "Save Settings"**

### Obtaining API Keys

#### OpenAI
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key
5. Copy and paste into the extension

#### Anthropic
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into the extension

#### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Copy and paste into the extension

#### Groq
1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into the extension

#### Ollama (Local)
1. Install Ollama from https://ollama.ai/
2. Run `ollama serve` to start the server
3. Pull a model: `ollama pull llama2`
4. No API key needed in the extension

## Updating the Extension

### Pull Latest Changes

```bash
git pull origin main
```

### Rebuild

```bash
npm run build
```

### Reload in Chrome

1. Go to `chrome://extensions/`
2. Find "Unified Browser Agent"
3. Click the refresh icon

## Troubleshooting

### Extension Not Loading

**Problem**: "Manifest file is missing or unreadable"

**Solution**: Make sure you selected the `dist/` folder, not the project root

---

**Problem**: Extension icon appears but doesn't work

**Solution**: 
1. Check the browser console for errors (F12)
2. Rebuild the extension
3. Reload the extension

### API Connection Issues

**Problem**: "API key is invalid"

**Solution**:
1. Verify your API key is correct
2. Check that you have credits/quota on your account
3. Ensure there are no trailing spaces in the API key

---

**Problem**: "Ollama connection failed"

**Solution**:
1. Verify Ollama is running: `ollama serve`
2. Check the default URL (http://localhost:11434)
3. Pull the model: `ollama pull llama2`

### Build Errors

**Problem**: `Cannot find module '@/types'`

**Solution**:
```bash
npm install
npm run build
```

---

**Problem**: `sharp` installation fails

**Solution**:
```bash
npm install --platform=linux --arch=x64 sharp
npm run build
```

### Runtime Errors

**Problem**: Content script not injecting

**Solution**:
1. Check that you're not on a `chrome://` page
2. Refresh the web page
3. Check manifest.json permissions

---

**Problem**: Side panel not opening

**Solution**:
1. Make sure you're using Chrome 114 or higher
2. Check the browser console for errors
3. Reload the extension

## Development Mode

### Watch Mode

For development with auto-rebuild:

```bash
npm run dev
```

This will watch for file changes and rebuild automatically.

### Hot Reload

After making changes:
1. Save your files
2. The build will automatically update
3. Go to `chrome://extensions/`
4. Click the refresh icon for the extension

### Debugging

#### Background Script
1. Go to `chrome://extensions/`
2. Click "Inspect views: service worker"
3. Use the console to debug

#### Content Script
1. Open any web page
2. Open DevTools (F12)
3. Check the Console tab for logs

#### Popup/Sidepanel
1. Right-click the popup or sidepanel
2. Select "Inspect"
3. Use DevTools normally

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Unified Browser Agent"
3. Click "Remove"
4. Confirm deletion

All settings and data will be removed from Chrome storage.

## Data Privacy

- All credentials are stored locally in Chrome's encrypted storage
- API keys never leave your device except when making LLM requests
- Local-only mode prevents any external communication
- No telemetry or usage data is collected
- All code is open source and auditable

## Next Steps

- Read the [Usage Guide](USAGE.md) to learn how to use the extension
- Check out [Examples](EXAMPLES.md) for common use cases
- Read the [Developer Guide](DEVELOPER.md) to extend the extension
