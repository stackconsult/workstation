# Chrome Web Store Deployment Guide

Complete guide for publishing stackBrowserAgent extension to Chrome Web Store.

## Prerequisites

- Chrome Web Store Developer account ($5 one-time fee)
- Built extension package
- Store listing assets (screenshots, icons, descriptions)

## Quick Deploy

### Option 1: Automated Script

```bash
# Build and package extension
./deploy-extension.sh
```

This creates a timestamped zip file ready for upload.

### Option 2: Manual Build

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Create package
cd dist
zip -r ../stackBrowserAgent.zip .
cd ..
```

## Store Submission Process

### Step 1: Developer Account Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 one-time registration fee
3. Complete developer profile

### Step 2: Create New Item

1. Click "New Item"
2. Upload zip file (stackBrowserAgent-TIMESTAMP.zip)
3. Click "Upload"

### Step 3: Store Listing

#### Required Information

**Extension Name:**
```
stackBrowserAgent - Enterprise Browser Agent
```

**Short Description (132 characters max):**
```
Enterprise hybrid browser agent with multi-agent orchestration, LLM integration, and workflow automation
```

**Detailed Description:**

```
stackBrowserAgent is an enterprise-grade hybrid browser automation system that combines local Chrome extension capabilities with optional cloud backend features.

🎯 KEY FEATURES

Multi-Agent Orchestration
• 6 specialized agents (Navigator, Planner, Validator, Executor, Extractor, Analyzer)
• Priority-based task queue
• Intelligent agent coordination and context passing

LLM Integration
• Support for OpenAI, Anthropic, Gemini, Groq, and Ollama
• BYOK (Bring Your Own Key) architecture
• Local and cloud LLM options

Browser Automation
• Direct DOM manipulation
• Form filling and data extraction
• Multi-tab workflow orchestration
• Screenshot and visual verification

Workflow Engine
• Visual workflow builder
• 7 pre-built templates
• Conditional logic and loops
• Variable resolution and context passing

Backend Integration (Optional)
• Python FastAPI backend for advanced features
• PostgreSQL database for persistence
• RAG-powered intelligence
• Multi-user support

Privacy & Security
• Local execution by default
• Secure API key storage
• No data sent to external servers (except configured LLM APIs)
• Open source and auditable

🚀 USE CASES

• Web scraping and data extraction
• Form automation
• Price monitoring and comparison
• Content aggregation
• Multi-step workflows
• Browser testing and verification

📚 DOCUMENTATION

Complete documentation available at:
https://github.com/stackconsult/stackBrowserAgent

🔒 PRIVACY

• All data processed locally
• API keys stored securely in Chrome storage
• Optional backend is self-hosted
• No telemetry or tracking

💼 ENTERPRISE FEATURES

• Multi-user support (with backend)
• Workflow sharing and templates
• Audit trails and logging
• Performance monitoring
• CI/CD integration

📖 GETTING STARTED

1. Install extension
2. Configure LLM provider (or use Ollama locally)
3. Create your first workflow
4. Optional: Deploy backend for advanced features

For issues and feature requests:
https://github.com/stackconsult/stackBrowserAgent/issues
```

#### Category

Select: **Productivity**

#### Language

Select: **English (United States)**

### Step 4: Graphics Assets

#### Icon Requirements

Extension already has icons in `public/icons/`:
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)

#### Screenshots (1280x800 or 640x400)

Create 3-5 screenshots showing:

1. **Main Sidepanel Interface**
   - Show chat interface
   - Display agent list
   - Show task monitoring

2. **Workflow Builder**
   - Show workflow creation
   - Display step configuration
   - Show template selection

3. **Settings & Configuration**
   - LLM provider setup
   - API key configuration
   - Backend connection settings

4. **Task Execution**
   - Show running workflow
   - Display results
   - Show agent activity

5. **Multi-Tab Operation** (optional)
   - Show parallel tasks
   - Display tab coordination
   - Show context switching

#### Promotional Images

**Small tile** (440x280):
- Simple logo with tagline
- "Enterprise Browser Agent"

**Large tile** (920x680):
- Feature highlights
- Screenshots
- Call to action

**Marquee** (1400x560):
- Hero image
- Key benefits
- Professional design

### Step 5: Privacy & Permissions

#### Single Purpose

```
Browser automation and workflow orchestration for enterprise productivity
```

#### Permission Justifications

**activeTab:**
```
Required to interact with the current browser tab for automation tasks
```

**storage:**
```
Required to securely store user preferences, API keys, and workflow definitions
```

**sidePanel:**
```
Required to display the main user interface for workflow management
```

**scripting:**
```
Required to execute automation scripts on web pages
```

**tabs:**
```
Required to manage multiple tabs for multi-tab workflows
```

#### Host Permissions

```
<all_urls>
```

**Justification:**
```
Required to enable browser automation on any website as configured by the user in their workflows
```

#### Remote Code

If using external LLM APIs:

```
Remote code is NOT executed. The extension makes API calls to user-configured LLM providers (OpenAI, Anthropic, etc.) for natural language processing. All API keys are stored locally and provided by the user.
```

#### Data Usage

```
DATA COLLECTED: None
All data is processed locally. The extension does not collect, transmit, or store any user data on external servers.

API KEYS: Stored locally in Chrome storage
WORKFLOWS: Stored locally in Chrome storage  
USAGE DATA: None collected

OPTIONAL BACKEND: Users may optionally deploy their own backend server for advanced features. This is self-hosted and under user control.

LLM API CALLS: Users may configure third-party LLM providers (OpenAI, Anthropic, etc.). Communication with these services is direct and controlled by the user's API keys.
```

### Step 6: Distribution

#### Visibility

Select: **Public** or **Unlisted**

- **Public**: Anyone can find and install
- **Unlisted**: Only those with link can install

#### Pricing

Select: **Free**

### Step 7: Review & Submit

1. Review all information
2. Check privacy compliance
3. Click "Submit for Review"

## Review Process

### Timeline

- Initial review: 1-3 business days
- Follow-up reviews: 1-2 business days

### Common Issues

1. **Permissions too broad**
   - Solution: Justify each permission clearly

2. **Privacy policy required**
   - Solution: Link to GitHub privacy documentation

3. **Screenshots unclear**
   - Solution: Add annotations and descriptions

4. **Single purpose unclear**
   - Solution: Clearly state automation and productivity focus

## Post-Publication

### Update Extension

1. Build new version
2. Increment version in manifest.json
3. Upload new package
4. Submit for review

### Monitor Reviews

- Respond to user reviews promptly
- Address issues in updates
- Gather feedback for improvements

### Analytics

View in Developer Dashboard:
- Install count
- Active users
- Uninstall rate
- User ratings

## Version Management

### Semantic Versioning

Follow format: MAJOR.MINOR.PATCH

Example:
- 1.0.0 - Initial release
- 1.1.0 - New features
- 1.1.1 - Bug fixes

### Changelog

Maintain CHANGELOG.md:

```markdown
## [1.0.0] - 2025-11-09
### Added
- Initial release
- Multi-agent orchestration
- LLM integration (5 providers)
- Workflow engine
- Backend integration

### Changed
- N/A

### Fixed
- N/A
```

## Marketing

### Launch Checklist

- [ ] Product Hunt submission
- [ ] Reddit r/chrome_extensions post
- [ ] Twitter announcement
- [ ] LinkedIn post
- [ ] GitHub release with binaries
- [ ] Update documentation with store link
- [ ] Create demo video
- [ ] Write blog post

### Store Optimization

**Keywords to target:**
- browser automation
- workflow automation
- AI agent
- web scraping
- RPA
- productivity tool

**A/B Testing:**
- Test different icons
- Try various screenshots
- Experiment with descriptions
- Monitor conversion rates

## Support

### User Support Channels

1. Chrome Web Store reviews
2. GitHub Issues
3. Documentation
4. Community Discord (if created)

### Common User Questions

Q: Is this free?
A: Yes, the extension is free. Optional backend deployment may have hosting costs.

Q: Does this work offline?
A: Yes, with local LLM (Ollama). Cloud LLMs require internet.

Q: Is my data safe?
A: All processing is local. No data sent to us. LLM API usage is direct between you and provider.

Q: Can I use this for my business?
A: Yes, open source MIT license. Deploy your own backend for full control.

## Removal Policy

If you need to remove the extension:

1. Mark as deprecated in store
2. Provide migration guide
3. Give users 30-day notice
4. Archive GitHub repository

## Legal

### License

MIT License - Include in store listing

### Terms of Service

Link to: https://github.com/stackconsult/stackBrowserAgent/blob/main/LICENSE

### Privacy Policy

Link to: https://github.com/stackconsult/stackBrowserAgent/blob/main/PRIVACY.md

## Next Steps

After Chrome Web Store approval:

1. Update README with install link
2. Create release notes
3. Share on social media
4. Monitor initial user feedback
5. Plan first update

## Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/quality_guidelines/)
- [Store Listing Guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/)
