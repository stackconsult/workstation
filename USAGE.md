# Usage Guide

## Quick Start

### Opening the Agent

1. **Click the extension icon** in your browser toolbar
2. **Click "Open Agent Chat"** to open the side panel
3. Start typing commands!

### Your First Command

Try these simple commands to get started:

```
Extract all links from this page
```

```
Summarize this article in 3 sentences
```

```
Find all prices on this page
```

## Using the Chat Interface

### Natural Language Commands

The agent understands natural language. Here are examples:

#### Navigation Commands
- "Go to the contact page"
- "Click on the login button"
- "Scroll down to the footer"
- "Navigate to github.com"

#### Data Extraction
- "Extract all email addresses from this page"
- "Get all product names and prices"
- "Find all headings on this page"
- "Extract the main article text"

#### Analysis
- "Summarize this page"
- "What is this page about?"
- "List the key points from this article"
- "Analyze the sentiment of these reviews"

#### Automation
- "Fill out this form with test data"
- "Click all 'Read More' buttons"
- "Download the PDF file"
- "Take a screenshot of the page"

### Multi-Step Tasks

The agent can handle complex multi-step tasks:

```
1. Navigate to the pricing page
2. Extract all plan names and prices
3. Summarize the differences between plans
```

The Planner Agent will break this down and coordinate with other agents to complete each step.

## Using Quick Actions

At the bottom of the side panel, you'll find quick action buttons:

### 📎 Extract Links
- Extracts all links from the current page
- Returns them in a structured format
- Perfect for building site maps or finding resources

### 📝 Summarize
- Generates a concise summary of the page
- Uses AI to identify key information
- Great for research and content review

### 📸 Screenshot
- Captures the visible portion of the page
- Returns a data URL of the image
- Useful for documentation and reports

## Using Context Menu

Right-click anywhere on a page to access agent features:

1. **Select text** on a page
2. **Right-click** the selected text
3. **Choose "Analyze with Agent"**
4. The side panel opens with the selected text

This is perfect for:
- Analyzing specific paragraphs
- Translating selected text
- Extracting data from tables
- Getting explanations of technical content

## Understanding Agent Types

### 🧭 Navigator Agent
**Purpose**: Understanding and navigating web pages

**Best for**:
- Finding elements on a page
- Understanding page structure
- Planning navigation strategies

**Example**: "Find the search button and explain its location"

### 📋 Planner Agent
**Purpose**: Breaking down complex tasks into steps

**Best for**:
- Multi-step workflows
- Complex automation tasks
- Strategic planning

**Example**: "Create a plan to compare prices across 3 shopping sites"

### ✅ Validator Agent
**Purpose**: Checking results and quality

**Best for**:
- Verifying extracted data
- Quality assurance
- Error detection

**Example**: "Validate that all required form fields are filled"

### ⚡ Executor Agent
**Purpose**: Performing browser actions

**Best for**:
- Clicking elements
- Filling forms
- Taking screenshots

**Example**: "Click the 'Sign Up' button"

### 📊 Extractor Agent
**Purpose**: Pulling data from pages

**Best for**:
- Scraping information
- Structuring unstructured data
- Building datasets

**Example**: "Extract all product details into a table"

### 🔍 Analyzer Agent
**Purpose**: Providing insights and analysis

**Best for**:
- Content analysis
- Sentiment detection
- Pattern recognition

**Example**: "Analyze these customer reviews for common complaints"

## Monitoring Active Tasks

### Task Status Panel

At the top of the side panel, you'll see active tasks with their status:

- **🟡 Thinking**: Agent is processing with LLM
- **🟠 Executing**: Performing browser actions
- **🟢 Completed**: Task finished successfully
- **🔴 Failed**: Task encountered an error

### Task Details

Click on a task to see:
- Full description
- Current status
- Assigned agent
- Results or error messages

## Advanced Usage

### Chaining Commands

You can chain multiple commands together:

```
First, extract all product names.
Then, for each product, get the price and rating.
Finally, create a comparison table.
```

The Planner Agent will coordinate multiple agents to accomplish this.

### Using Variables

Reference previous results in new commands:

```
User: Extract the contact email
Agent: Found: contact@example.com

User: Now compose a message to that email
Agent: [Opens composition interface]
```

### Conditional Logic

Add conditions to your commands:

```
If the price is under $50, add it to cart.
Otherwise, notify me.
```

### Loops and Iterations

Process multiple items:

```
For each product card on this page:
  - Extract the name
  - Extract the price
  - Check if it's on sale
```

## Working with Different Page Types

### E-commerce Sites

Common tasks:
- Price comparison
- Product information extraction
- Automated form filling for checkout
- Review analysis

Example:
```
Compare the price of "iPhone 15" across Amazon, BestBuy, and Target
```

### News Sites

Common tasks:
- Article summarization
- Headline extraction
- Content categorization
- Author information gathering

Example:
```
Summarize today's top 5 headlines from this news site
```

### Documentation Sites

Common tasks:
- API endpoint extraction
- Code example collection
- Navigation assistance
- Content indexing

Example:
```
Extract all API endpoints and their descriptions from this documentation
```

### Social Media

Common tasks:
- Post extraction
- Sentiment analysis
- User information gathering
- Engagement metrics

Example:
```
Analyze the sentiment of the top 10 comments on this post
```

## Privacy and Security

### Data Handling

- **Local Processing**: When possible, processing happens locally
- **API Calls**: Only made when you submit commands requiring LLM
- **No Tracking**: No usage data is collected or transmitted
- **Secure Storage**: Credentials encrypted in Chrome storage

### Privacy Mode

Two modes available in settings:

#### Cloud Allowed (Default)
- LLM requests sent to configured provider
- Faster processing with powerful models
- Requires API key and internet

#### Local Only
- All processing on your device
- Requires Ollama installation
- Complete privacy, no data leaves your computer
- May be slower depending on hardware

### What Gets Sent to LLMs

When using cloud providers, the following may be sent:
- Your command/prompt
- Page content (HTML, text)
- Selected text or elements
- Previous conversation context

**Never sent**:
- Your API keys (stored locally only)
- Credentials or passwords
- Credit card information
- Unrelated browsing data

## Tips and Best Practices

### 1. Be Specific

❌ Bad: "Get data from this page"
✅ Good: "Extract all product names, prices, and ratings from this page"

### 2. Use Context

Include relevant details:
```
On this product listing page, extract the first 10 products with their names, prices, and availability status
```

### 3. Check Permissions

Some actions require page permissions. If blocked:
1. Check the page isn't a `chrome://` URL
2. Refresh the page
3. Try the command again

### 4. Handle Errors Gracefully

If a command fails:
1. Read the error message
2. Check the task status panel
3. Try rephrasing your command
4. Break complex tasks into smaller steps

### 5. Save Useful Workflows

For repeated tasks, document successful commands:
```markdown
# My Workflows

## Price Comparison
1. Navigate to product page
2. Extract product name and price
3. Search for product on competitor sites
4. Compare results
```

## Keyboard Shortcuts

- **Enter**: Send message (in chat input)
- **Shift+Enter**: New line (in chat input)
- **Esc**: Close side panel

## Getting Help

### In-Extension Help

Type these commands for assistance:
```
help
```
```
what can you do?
```
```
show examples
```

### Common Issues

**Agent not responding**
- Check LLM provider settings
- Verify API key is valid
- Check internet connection
- Look at task status panel

**Incorrect results**
- Try rephrasing your command
- Be more specific about what you want
- Break task into smaller steps

**Permission errors**
- Can't access `chrome://` pages
- Some sites block automation
- Check manifest permissions

## Next Steps

- Try the [Examples](EXAMPLES.md) for common use cases
- Read the [Developer Guide](DEVELOPER.md) to create custom agents
- Check out the [API Reference](API.md) for programmatic access
