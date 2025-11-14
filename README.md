# Unified Browser Agent

A comprehensive browser extension combining the best features from multiple AI-powered browser agent systems:

- **BrowserOperator.io**: Multi-agent orchestration and natural language commands
- **BrowserOS**: Privacy-first architecture with local LLM support
- **Nanobrowser**: Flexible multi-agent system with real-time chat
- **BrowserAgent.dev**: No-code workflow builder and visual automation

## Features

### 🤖 Multi-Agent System
- **Navigator Agent**: Understands and navigates web page structures
- **Planner Agent**: Creates strategic execution plans for complex tasks
- **Validator Agent**: Ensures quality and validates results
- **Executor Agent**: Executes browser automation tasks
- **Extractor Agent**: Extracts and structures data from web pages
- **Analyzer Agent**: Provides insights and analysis

### 🔐 Privacy-First Architecture
- Local-only execution mode available
- BYOK (Bring Your Own Key) for cloud LLMs
- No data sharing with third parties
- Secure credential storage

### 🌐 LLM Provider Support
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude
- Google Gemini
- Groq
- Ollama (Local models)
- Custom providers

### 🎯 Browser Automation
- Natural language command processing
- Page navigation and element interaction
- Data extraction and scraping
- Screenshot capture
- Form automation
- Custom JavaScript execution

### 💬 Interactive Interface
- Chat-based side panel
- Quick action buttons
- Real-time task monitoring
- Conversation history
- Context menu integration

## Quick Deploy Backend to Railway

Deploy the backend API instantly with one click:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3fjp1R?referralCode=yft2bJ&utm_medium=integration&utm_source=template&utm_campaign=generic)

After deployment:
1. Railway will provision PostgreSQL automatically
2. Set your JWT secret and optional API keys
3. Get your deployment URL
4. Configure the Chrome extension with the backend URL

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
# Start development mode with watch
npm run dev

# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm test
```

## Configuration

1. Click the extension icon in your browser toolbar
2. Go to Settings
3. Configure your LLM provider:
   - Select your preferred provider
   - Enter your API key (stored locally)
   - Choose privacy mode
4. Save settings

## Usage

### Using the Chat Interface

1. Click the extension icon
2. Click "Open Agent Chat"
3. Type natural language commands:
   - "Extract all links from this page"
   - "Summarize this article"
   - "Find all product prices"
   - "Navigate to the contact page"

### Using Context Menu

1. Right-click on any web page
2. Select "Analyze with Agent"
3. The agent will analyze the selected content

### Quick Actions

Use pre-built quick actions for common tasks:
- Extract Links
- Summarize Page
- Take Screenshot

## Architecture

```
src/
├── agents/          # Multi-agent system
│   ├── base.ts      # Base agent classes
│   └── orchestrator.ts  # Agent coordination
├── llm/             # LLM provider integrations
│   └── providers.ts
├── automation/      # Browser automation
│   └── browser.ts
├── background/      # Background service worker
│   └── index.ts
├── content/         # Content scripts
│   └── index.ts
├── sidepanel/       # Side panel UI
│   ├── App.tsx
│   ├── index.tsx
│   └── styles.css
├── popup/           # Popup UI
│   ├── App.tsx
│   ├── index.tsx
│   └── styles.css
└── types/           # TypeScript definitions
    └── index.ts
```

## Security

- All credentials are stored locally using Chrome's secure storage
- API keys are never transmitted to third parties
- Local-only mode prevents any cloud communication
- Content scripts run in isolated contexts
- Permissions are requested explicitly

## Privacy

This extension is designed with privacy as a top priority:

- **Local Execution**: All agent logic runs locally in your browser
- **No Telemetry**: No usage data is collected or transmitted
- **BYOK**: You control your own API keys
- **Open Source**: All code is auditable
- **Transparent**: Clear indication of what data is processed

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

This project combines inspiration and architecture from:
- BrowserOperator.io
- BrowserOS
- Nanobrowser
- BrowserAgent.dev

## Roadmap

- [ ] Workflow visual designer
- [ ] Pre-built workflow templates
- [ ] Multi-tab coordination
- [ ] Advanced data transformation
- [ ] Plugin system
- [ ] Cloud sync (optional)
- [ ] Team collaboration features
