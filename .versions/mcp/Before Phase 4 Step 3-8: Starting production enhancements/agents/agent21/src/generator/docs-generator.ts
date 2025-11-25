/**
 * Documentation Generator - Auto-generates comprehensive documentation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { BuilderConfig } from '../index';

export class DocumentationGenerator {
  /**
   * Generate all documentation for the project
   */
  async generateDocs(config: BuilderConfig, projectPath: string): Promise<void> {
    const docsDir = path.join(projectPath, 'docs');
    
    // Generate API documentation
    await this.generateApiDocs(config, docsDir);
    
    // Generate architecture documentation
    await this.generateArchitectureDocs(config, docsDir);
    
    // Generate contributing guide
    await this.generateContributingGuide(config, docsDir);
  }

  private async generateApiDocs(config: BuilderConfig, docsDir: string): Promise<void> {
    const content = `# API Documentation

## MCP Tools

This document describes all available MCP tools in ${config.projectName}.

${this.generateToolDocs(config)}

## Usage

All tools are available through the MCP protocol when using Claude Desktop or other MCP clients.

## Error Handling

All tools return structured error responses when operations fail:

\`\`\`json
{
  "content": [{
    "type": "text",
    "text": "Error: <error message>"
  }],
  "isError": true
}
\`\`\`
`;
    await fs.writeFile(path.join(docsDir, 'API.md'), content);
  }

  private generateToolDocs(config: BuilderConfig): string {
    let docs = '';

    if (config.features.includes('browser')) {
      docs += `### Browser Automation

- **browser_navigate**: Navigate to a URL
- **browser_screenshot**: Capture screenshots
- **browser_click**: Click elements
- **browser_type**: Type into inputs
- **browser_get_text**: Extract text content

`;
    }

    if (config.features.includes('files')) {
      docs += `### File Processing

- **file_read_csv**: Read CSV files
- **file_read_excel**: Read Excel files
- **file_read_pdf**: Extract text from PDFs

`;
    }

    if (config.features.includes('api')) {
      docs += `### API Integration

- **api_request**: Make HTTP requests to APIs

`;
    }

    if (config.features.includes('database')) {
      docs += `### Database Operations

- **db_query**: Execute SQL queries
- **db_insert**: Insert data into tables

`;
    }

    if (config.features.includes('email')) {
      docs += `### Email

- **email_send**: Send emails

`;
    }

    return docs;
  }

  private async generateArchitectureDocs(config: BuilderConfig, docsDir: string): Promise<void> {
    const content = `# Architecture

## Overview

${config.projectName} is built as a Model Context Protocol (MCP) server that provides automation capabilities to Claude and other MCP clients.

## Components

### MCP Server
The core server implements the MCP protocol and exposes tools to clients.

### Tools
Individual tool implementations for each feature area:

${config.features.map(f => `- **${f}**: Tools for ${f} operations`).join('\n')}

### Handlers
Business logic handlers that implement the actual functionality behind each tool.

### Utilities
Shared utility functions for logging, configuration, and common operations.

## Data Flow

1. Client (Claude) sends tool invocation request
2. MCP server receives and validates request
3. Appropriate handler processes the request
4. Response is formatted and returned to client

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Protocol**: Model Context Protocol (MCP)
- **Key Libraries**:
${config.features.includes('browser') ? '  - Playwright (browser automation)\n' : ''}${config.features.includes('database') ? '  - SQLite3 (database)\n' : ''}${config.features.includes('files') ? '  - xlsx, csv-parser, pdf-parse (file processing)\n' : ''}
`;
    await fs.writeFile(path.join(docsDir, 'ARCHITECTURE.md'), content);
  }

  private async generateContributingGuide(config: BuilderConfig, docsDir: string): Promise<void> {
    const content = `# Contributing to ${config.projectName}

## Development Setup

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Build: \`npm run build\`
4. Test: \`npm test\`

## Project Structure

\`\`\`
src/
├── index.ts           # MCP server entry point
├── tools/             # Tool definitions
├── handlers/          # Tool implementations
├── utils/             # Utility functions
└── config/            # Configuration
\`\`\`

## Adding New Tools

1. Define the tool in \`src/tools/\`
2. Implement the handler in \`src/handlers/\`
3. Register the tool in \`src/index.ts\`
4. Add tests in \`tests/\`
5. Document in \`docs/API.md\`

## Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Add JSDoc comments for public APIs
- Write tests for new features

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Add tests
4. Update documentation
5. Submit PR with clear description

## License

MIT
`;
    await fs.writeFile(path.join(docsDir, 'CONTRIBUTING.md'), content);
  }
}
