/**
 * Automation Builder - Core project structure generator
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { BuilderConfig } from '../index';

export class AutomationBuilder {
  /**
   * Create complete project directory structure
   */
  async createProjectStructure(config: BuilderConfig): Promise<string> {
    const projectPath = path.resolve(config.outputPath, config.projectName);

    // Create base directories
    await fs.ensureDir(projectPath);
    await fs.ensureDir(path.join(projectPath, 'src'));
    await fs.ensureDir(path.join(projectPath, 'src', 'tools'));
    await fs.ensureDir(path.join(projectPath, 'src', 'handlers'));
    await fs.ensureDir(path.join(projectPath, 'src', 'utils'));
    await fs.ensureDir(path.join(projectPath, 'src', 'config'));
    await fs.ensureDir(path.join(projectPath, 'tests'));
    await fs.ensureDir(path.join(projectPath, 'docs'));
    await fs.ensureDir(path.join(projectPath, 'examples'));
    await fs.ensureDir(path.join(projectPath, '.github', 'workflows'));

    return projectPath;
  }

  /**
   * Initialize project with package.json and configuration
   */
  async initializeProject(projectPath: string, config: BuilderConfig): Promise<void> {
    // Generate package.json
    const packageJson = this.generatePackageJson(config);
    await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    // Generate tsconfig.json
    const tsConfig = this.generateTsConfig();
    await fs.writeJSON(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

    // Generate .gitignore
    const gitignore = this.generateGitignore();
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

    // Generate .env.example
    const envExample = this.generateEnvExample(config);
    await fs.writeFile(path.join(projectPath, '.env.example'), envExample);

    // Generate README.md
    const readme = this.generateReadme(config);
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  private generatePackageJson(config: BuilderConfig) {
    const dependencies: Record<string, string> = {
      '@modelcontextprotocol/sdk': '^0.5.0'
    };

    const devDependencies: Record<string, string> = {
      '@types/node': '^20.10.0',
      'typescript': '^5.3.3',
      'ts-node': '^10.9.2',
      '@types/jest': '^29.5.11',
      'jest': '^29.7.0',
      'ts-jest': '^29.1.1'
    };

    // Add feature-specific dependencies
    if (config.features.includes('browser')) {
      dependencies['playwright'] = '^1.40.0';
    }
    if (config.features.includes('database')) {
      dependencies['sqlite3'] = '^5.1.6';
      dependencies['sqlite'] = '^5.1.1';
    }
    if (config.features.includes('files')) {
      dependencies['xlsx'] = '^0.18.5';
      dependencies['pdf-parse'] = '^1.1.1';
      dependencies['csv-parser'] = '^3.0.0';
    }
    if (config.features.includes('scheduling')) {
      dependencies['node-cron'] = '^3.0.3';
    }
    if (config.features.includes('email')) {
      dependencies['nodemailer'] = '^6.9.7';
      devDependencies['@types/nodemailer'] = '^6.4.14';
    }
    if (config.features.includes('api') || config.features.includes('webhooks')) {
      dependencies['axios'] = '^1.6.2';
    }
    if (config.features.includes('rest-api')) {
      dependencies['express'] = '^4.18.2';
      devDependencies['@types/express'] = '^4.17.21';
    }

    // Add integration-specific dependencies
    if (config.integrations.includes('slack')) {
      dependencies['@slack/web-api'] = '^6.10.0';
    }
    if (config.integrations.includes('github')) {
      dependencies['@octokit/rest'] = '^20.0.2';
    }
    if (config.integrations.includes('stripe')) {
      dependencies['stripe'] = '^14.7.0';
    }
    if (config.integrations.includes('sendgrid')) {
      dependencies['@sendgrid/mail'] = '^8.1.0';
    }
    if (config.integrations.includes('twilio')) {
      dependencies['twilio'] = '^4.19.3';
    }

    return {
      name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: config.description,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'ts-node src/index.ts',
        test: 'jest',
        'test:watch': 'jest --watch',
        lint: 'tsc --noEmit'
      },
      keywords: ['automation', 'mcp', 'workstation', config.useCase],
      author: '',
      license: 'MIT',
      dependencies,
      devDependencies
    };
  }

  private generateTsConfig() {
    return {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        moduleResolution: 'node',
        resolveJsonModule: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests']
    };
  }

  private generateGitignore(): string {
    return `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Test coverage
coverage/
.nyc_output/

# Temporary
tmp/
temp/
*.tmp

# Database
*.db
*.sqlite
*.sqlite3
`;
  }

  private generateEnvExample(config: BuilderConfig): string {
    let envContent = `# ${config.projectName} Configuration

# MCP Server
MCP_SERVER_NAME=${config.projectName}
MCP_SERVER_VERSION=1.0.0

# Logging
LOG_LEVEL=info
NODE_ENV=development

`;

    if (config.features.includes('database')) {
      envContent += `# Database
DATABASE_PATH=./data.db

`;
    }

    if (config.features.includes('email')) {
      envContent += `# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

`;
    }

    if (config.integrations.includes('slack')) {
      envContent += `# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret

`;
    }

    if (config.integrations.includes('github')) {
      envContent += `# GitHub
GITHUB_TOKEN=ghp_your_token

`;
    }

    if (config.integrations.includes('stripe')) {
      envContent += `# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

`;
    }

    return envContent;
  }

  private generateReadme(config: BuilderConfig): string {
    return `# ${config.projectName}

${config.description}

## Overview

This automation system was generated by Agent 21 (Universal Automation Builder) and includes:

### Features
${config.features.map(f => `- ✅ ${this.getFeatureName(f)}`).join('\n')}

### Integrations
${config.integrations.length > 0 ? config.integrations.map(i => `- 🔗 ${this.getIntegrationName(i)}`).join('\n') : '- None configured'}

### Use Case
Primary focus: **${this.getUseCaseName(config.useCase)}**

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

1. Copy \`.env.example\` to \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Update \`.env\` with your credentials

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Production

\`\`\`bash
npm start
\`\`\`

## Project Structure

\`\`\`
${config.projectName}/
├── src/
│   ├── index.ts           # Main MCP server entry
│   ├── tools/             # MCP tools implementation
│   ├── handlers/          # Business logic handlers
│   ├── utils/             # Utility functions
│   └── config/            # Configuration
├── tests/                 # Test files
├── docs/                  # Documentation
├── examples/              # Usage examples
└── package.json
\`\`\`

## MCP Server

This project implements a Model Context Protocol (MCP) server that provides tools for:

${this.generateToolList(config)}

### Using with Claude Desktop

Add to your Claude Desktop config (\`~/Library/Application Support/Claude/claude_desktop_config.json\` on macOS):

\`\`\`json
{
  "mcpServers": {
    "${config.projectName}": {
      "command": "node",
      "args": ["/path/to/${config.projectName}/dist/index.js"]
    }
  }
}
\`\`\`

## Development

### Testing

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Documentation

- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Examples](./examples/)

## Deployment

### ${this.getDeploymentName(config.deployment)}

${this.getDeploymentInstructions(config.deployment)}

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Generated by Agent 21 - Universal Automation Builder
`;
  }

  private getFeatureName(feature: string): string {
    const names: Record<string, string> = {
      'browser': 'Browser Automation (Playwright)',
      'api': 'API Integration',
      'database': 'Database Support',
      'files': 'File Processing (CSV, Excel, PDF)',
      'scheduling': 'Scheduled Tasks (Cron)',
      'email': 'Email Notifications',
      'webhooks': 'Webhook Support',
      'rest-api': 'REST API Server'
    };
    return names[feature] || feature;
  }

  private getIntegrationName(integration: string): string {
    const names: Record<string, string> = {
      'github': 'GitHub',
      'slack': 'Slack',
      'discord': 'Discord',
      'stripe': 'Stripe',
      'sendgrid': 'SendGrid',
      'twilio': 'Twilio',
      'aws': 'AWS',
      'gcloud': 'Google Cloud'
    };
    return names[integration] || integration;
  }

  private getUseCaseName(useCase: string): string {
    const names: Record<string, string> = {
      'ecommerce': 'E-commerce Automation',
      'data-processing': 'Data Processing & Analytics',
      'web-scraping': 'Web Scraping & Monitoring',
      'communication': 'Email & Communication',
      'workflow': 'Workflow Automation',
      'testing': 'Testing & QA',
      'social-media': 'Social Media Management',
      'custom': 'Custom Automation'
    };
    return names[useCase] || useCase;
  }

  private generateToolList(config: BuilderConfig): string {
    const tools: string[] = [];
    
    if (config.features.includes('browser')) {
      tools.push('- Browser automation and web scraping');
    }
    if (config.features.includes('files')) {
      tools.push('- File processing (CSV, Excel, PDF)');
    }
    if (config.features.includes('api')) {
      tools.push('- API requests and integrations');
    }
    if (config.features.includes('database')) {
      tools.push('- Database operations');
    }
    if (config.features.includes('email')) {
      tools.push('- Email sending');
    }

    return tools.length > 0 ? tools.join('\n') : '- Custom automation tools';
  }

  private getDeploymentName(deployment: string): string {
    const names: Record<string, string> = {
      'local': 'Local/Self-hosted',
      'railway': 'Railway',
      'vercel': 'Vercel',
      'docker': 'Docker',
      'cloud': 'Cloud (AWS/GCP/Azure)'
    };
    return names[deployment] || deployment;
  }

  private getDeploymentInstructions(deployment: string): string {
    const instructions: Record<string, string> = {
      'local': 'Run directly on your machine:\n```bash\nnpm run build\nnpm start\n```',
      'railway': 'Deploy to Railway:\n1. Push to GitHub\n2. Connect repository in Railway\n3. Railway will auto-deploy',
      'vercel': 'Deploy to Vercel:\n```bash\nvercel --prod\n```',
      'docker': 'Build and run Docker container:\n```bash\ndocker build -t ${config.projectName} .\ndocker run -p 3000:3000 ${config.projectName}\n```',
      'cloud': 'Deploy to cloud provider of your choice. See provider-specific documentation.'
    };
    return instructions[deployment] || 'See deployment documentation.';
  }
}
