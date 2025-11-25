/**
 * CLI Interface for Agent 21
 * Interactive questionnaire and live system generation
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { UniversalBuilder, BuilderConfig } from './index';

async function main() {
  console.log(chalk.cyan.bold('\n🤖 Agent 21: Universal Automation Builder\n'));
  console.log(chalk.gray('Create personalized automation systems in minutes\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      validate: (input: string) => input.length >= 3 || 'Name must be at least 3 characters'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Describe your automation system:',
      validate: (input: string) => input.length > 0 || 'Description is required'
    },
    {
      type: 'list',
      name: 'useCase',
      message: 'What is your primary use case?',
      choices: [
        { name: '🛒 E-commerce Automation', value: 'ecommerce' },
        { name: '📊 Data Processing & Analytics', value: 'data-processing' },
        { name: '🌐 Web Scraping & Monitoring', value: 'web-scraping' },
        { name: '📧 Email & Communication', value: 'communication' },
        { name: '🔄 Workflow Automation', value: 'workflow' },
        { name: '🧪 Testing & QA', value: 'testing' },
        { name: '📱 Social Media Management', value: 'social-media' },
        { name: '🎯 Custom/Other', value: 'custom' }
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { name: 'Browser Automation (Playwright)', value: 'browser', checked: true },
        { name: 'API Integration', value: 'api', checked: true },
        { name: 'Database Support', value: 'database' },
        { name: 'File Processing (CSV, Excel, PDF)', value: 'files' },
        { name: 'Scheduled Tasks (Cron)', value: 'scheduling' },
        { name: 'Email Notifications', value: 'email' },
        { name: 'Webhook Support', value: 'webhooks' },
        { name: 'REST API Server', value: 'rest-api' }
      ],
      validate: (input: string[]) => input.length > 0 || 'Select at least one feature'
    },
    {
      type: 'checkbox',
      name: 'integrations',
      message: 'Select integrations (optional):',
      choices: [
        { name: 'GitHub', value: 'github' },
        { name: 'Slack', value: 'slack' },
        { name: 'Discord', value: 'discord' },
        { name: 'Stripe', value: 'stripe' },
        { name: 'SendGrid', value: 'sendgrid' },
        { name: 'Twilio', value: 'twilio' },
        { name: 'AWS', value: 'aws' },
        { name: 'Google Cloud', value: 'gcloud' }
      ]
    },
    {
      type: 'list',
      name: 'deployment',
      message: 'How will you deploy this?',
      choices: [
        { name: '💻 Local/Self-hosted', value: 'local' },
        { name: '🚂 Railway', value: 'railway' },
        { name: '▲ Vercel', value: 'vercel' },
        { name: '🐳 Docker', value: 'docker' },
        { name: '☁️ AWS/GCP/Azure', value: 'cloud' }
      ]
    },
    {
      type: 'input',
      name: 'outputPath',
      message: 'Output directory:',
      default: './generated-automation'
    }
  ]);

  const config: BuilderConfig = answers as BuilderConfig;

  console.log(chalk.yellow('\n📋 Configuration Summary:'));
  console.log(chalk.gray('────────────────────────────'));
  console.log(`Project: ${chalk.white(config.projectName)}`);
  console.log(`Use Case: ${chalk.white(config.useCase)}`);
  console.log(`Features: ${chalk.white(config.features.join(', '))}`);
  console.log(`Integrations: ${chalk.white(config.integrations.join(', ') || 'None')}`);
  console.log(`Deployment: ${chalk.white(config.deployment)}`);
  console.log(chalk.gray('────────────────────────────\n'));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Generate automation system with these settings?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('❌ Generation cancelled'));
    return;
  }

  const spinner = ora('Generating your automation system...').start();

  try {
    const builder = new UniversalBuilder();
    
    // Validate configuration
    const validation = builder.validateConfig(config);
    if (!validation.valid) {
      spinner.fail('Invalid configuration');
      validation.errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
      return;
    }

    // Generate the system
    const result = await builder.generate(config);

    if (result.success) {
      spinner.succeed(chalk.green('System generated successfully!'));
      console.log(chalk.cyan(`\n📂 Location: ${result.path}`));
      console.log(chalk.gray('\n🚀 Next steps:'));
      console.log(chalk.white(`  cd ${config.outputPath}`));
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm run dev'));
      console.log(chalk.gray('\n📖 Check README.md for detailed documentation\n'));
    } else {
      spinner.fail('Generation failed');
      console.log(chalk.red(`\n❌ ${result.message}\n`));
    }
  } catch (error) {
    spinner.fail('Generation failed');
    console.error(chalk.red('\n❌ Error:'), error);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
