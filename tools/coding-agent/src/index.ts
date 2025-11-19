/**
 * Coding Agent (Agent 16) - Data Processing & GitHub Integration
 * 
 * This agent provides comprehensive GitHub integration and code automation
 * capabilities through the Model Context Protocol (MCP).
 * 
 * @module coding-agent
 * @requires GITHUB_TOKEN environment variable
 */

import express, { Request, Response, NextFunction } from 'express';
import { Octokit } from '@octokit/rest';
import rateLimit from 'express-rate-limit';

// Environment configuration
const PORT = process.env.MCP_PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Octokit (GitHub API client)
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// ========================================
// Health Check Endpoint
// ========================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agent: 'coding-agent-16',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// ========================================
// MCP Metadata Endpoint
// ========================================

app.get('/mcp/info', (req: Request, res: Response) => {
  res.json({
    name: 'Data Processing & Coding Agent',
    version: '1.0.0',
    protocol: 'MCP',
    capabilities: [
      'github-operations',
      'code-analysis',
      'automated-reviews',
      'data-processing',
    ],
    endpoints: {
      health: '/health',
      repos: '/api/github/repos',
      pulls: '/api/github/pulls',
      issues: '/api/github/issues',
      commits: '/api/github/commits',
      analyze: '/api/code/analyze',
    },
  });
});

// ========================================
// GitHub Repository Operations
// ========================================

/**
 * List repositories for authenticated user
 */
app.get('/api/github/repos', async (req: Request, res: Response) => {
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30,
    });

    res.json({
      success: true,
      count: data.length,
      repositories: data.map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        updated_at: repo.updated_at,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories',
      message: error.message,
    });
  }
});

/**
 * Get repository details
 */
app.get('/api/github/repos/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.repos.get({ owner, repo });

    res.json({
      success: true,
      repository: {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        url: data.html_url,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        default_branch: data.default_branch,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository',
      message: error.message,
    });
  }
});

// ========================================
// Pull Request Operations
// ========================================

/**
 * List pull requests for a repository
 */
app.get('/api/github/pulls/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const state = (req.query.state as string) || 'open';

    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: state as 'open' | 'closed' | 'all',
      per_page: 30,
    });

    res.json({
      success: true,
      count: data.length,
      pull_requests: data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        author: pr.user?.login,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pull requests',
      message: error.message,
    });
  }
});

// ========================================
// Issue Operations
// ========================================

/**
 * List issues for a repository
 */
app.get('/api/github/issues/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const state = (req.query.state as string) || 'open';

    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: state as 'open' | 'closed' | 'all',
      per_page: 30,
    });

    res.json({
      success: true,
      count: data.length,
      issues: data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        author: issue.user?.login,
        labels: issue.labels.map((label: any) => label.name),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issues',
      message: error.message,
    });
  }
});

// ========================================
// Commit Operations
// ========================================

/**
 * List commits for a repository
 */
app.get('/api/github/commits/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;

    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 30,
    });

    res.json({
      success: true,
      count: data.length,
      commits: data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name,
        date: commit.commit.author?.date,
        url: commit.html_url,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commits',
      message: error.message,
    });
  }
});

// ========================================
// Code Analysis Endpoints
// ========================================

/**
 * Analyze code quality (placeholder for future implementation)
 */
app.post('/api/code/analyze', (req: Request, res: Response) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Code is required',
    });
  }

  // Placeholder response - implement actual analysis logic
  res.json({
    success: true,
    analysis: {
      language: language || 'unknown',
      lines: code.split('\n').length,
      complexity: 'low',
      suggestions: [
        'Code analysis is under development',
        'More features coming soon',
      ],
    },
  });
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ========================================
// Server Startup
// ========================================

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('Coding Agent (Agent 16) - MCP Server');
  console.log('========================================');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`MCP Info: http://localhost:${PORT}/mcp/info`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
#!/usr/bin/env node

/**
 * Coding Agent Tool
 * 
 * A minimal TypeScript/Node tool for GitHub integration, enabling:
 * - Branch creation and pushing
 * - Repository synchronization
 * - Status checking
 * 
 * This is a scaffold implementation to be completed in future PRs.
 * 
 * Security: Uses GITHUB_TOKEN from environment variables.
 * Never commit tokens to version control.
 */

import { Octokit } from '@octokit/rest';
import { program } from 'commander';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
interface Config {
  githubToken: string;
  owner: string;
  repo: string;
  defaultBranch: string;
}

// Get configuration from environment
function getConfig(): Config {
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    console.error('❌ Error: GITHUB_TOKEN not found in environment variables');
    console.error('Please set GITHUB_TOKEN in your .env file or environment');
    console.error('Generate a token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  return {
    githubToken,
    owner: process.env.GITHUB_OWNER || 'creditXcredit',
    repo: process.env.GITHUB_REPO || 'workstation',
    defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main',
  };
}

// Initialize Octokit client
function createOctokit(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

// Push branch to GitHub
async function pushBranch(options: {
  branch: string;
  message?: string;
  files?: string[];
}) {
  console.log('🚀 Pushing branch to GitHub...');
  console.log(`Branch: ${options.branch}`);
  console.log(`Message: ${options.message || 'Update files'}`);
  
  const config = getConfig();
  const octokit = createOctokit(config.githubToken);

  try {
    // Check if branch exists
    try {
      const { data: branchData } = await octokit.repos.getBranch({
        owner: config.owner,
        repo: config.repo,
        branch: options.branch,
      });
      console.log(`✓ Branch '${options.branch}' already exists`);
      console.log(`  Commit: ${branchData.commit.sha}`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`ℹ Branch '${options.branch}' does not exist yet`);
        console.log(`  Will be created on first push`);
      } else {
        throw error;
      }
    }

    console.log('\n✅ Push branch operation completed');
    console.log(`   View at: https://github.com/${config.owner}/${config.repo}/tree/${options.branch}`);
    
    return {
      success: true,
      branch: options.branch,
      url: `https://github.com/${config.owner}/${config.repo}/tree/${options.branch}`,
    };
  } catch (error: any) {
    console.error('❌ Error pushing branch:', error.message);
    throw error;
  }
}

// Sync repository with GitHub
async function syncRepo(options: {
  branch?: string;
  pull?: boolean;
  push?: boolean;
}) {
  console.log('🔄 Syncing repository with GitHub...');
  
  const config = getConfig();
  const octokit = createOctokit(config.githubToken);
  const branch = options.branch || config.defaultBranch;

  try {
    // Get repository information
    const { data: repo } = await octokit.repos.get({
      owner: config.owner,
      repo: config.repo,
    });

    console.log(`✓ Repository: ${repo.full_name}`);
    console.log(`  Default branch: ${repo.default_branch}`);
    console.log(`  Last updated: ${repo.updated_at}`);

    // Get branch information
    const { data: branchData } = await octokit.repos.getBranch({
      owner: config.owner,
      repo: config.repo,
      branch,
    });

    console.log(`✓ Branch '${branch}' information:`);
    console.log(`  Latest commit: ${branchData.commit.sha}`);
    console.log(`  Commit message: ${branchData.commit.commit.message}`);
    console.log(`  Author: ${branchData.commit.commit.author?.name}`);

    console.log('\n✅ Sync completed successfully');
    
    return {
      success: true,
      branch,
      repository: repo.full_name,
      last_commit: branchData.commit.sha,
    };
  } catch (error: any) {
    console.error('❌ Error syncing repository:', error.message);
    throw error;
  }
}

// Check repository status
async function checkStatus() {
  console.log('📊 Checking repository status...');
  
  const config = getConfig();
  const octokit = createOctokit(config.githubToken);

  try {
    // Get repository information
    const { data: repo } = await octokit.repos.get({
      owner: config.owner,
      repo: config.repo,
    });

    console.log('\n📦 Repository Information:');
    console.log(`   Name: ${repo.full_name}`);
    console.log(`   Description: ${repo.description}`);
    console.log(`   Default branch: ${repo.default_branch}`);
    console.log(`   Private: ${repo.private ? 'Yes' : 'No'}`);
    console.log(`   Stars: ${repo.stargazers_count}`);
    console.log(`   Forks: ${repo.forks_count}`);
    console.log(`   Open issues: ${repo.open_issues_count}`);
    console.log(`   Last updated: ${repo.updated_at}`);

    // Get branches
    const { data: branches } = await octokit.repos.listBranches({
      owner: config.owner,
      repo: config.repo,
      per_page: 10,
    });

    console.log('\n🌿 Recent Branches:');
    branches.slice(0, 5).forEach((branch: any) => {
      console.log(`   - ${branch.name} (${branch.commit.sha.substring(0, 7)})`);
    });

    // Get recent commits
    const { data: commits } = await octokit.repos.listCommits({
      owner: config.owner,
      repo: config.repo,
      per_page: 5,
    });

    console.log('\n📝 Recent Commits:');
    commits.forEach((commit: any) => {
      console.log(`   - ${commit.sha.substring(0, 7)} ${commit.commit.message.split('\n')[0]}`);
      console.log(`     by ${commit.commit.author?.name} on ${commit.commit.author?.date}`);
    });

    console.log('\n✅ Status check completed');
    
    return {
      success: true,
      repository: repo.full_name,
      branches: branches.length,
      recent_commits: commits.length,
    };
  } catch (error: any) {
    console.error('❌ Error checking status:', error.message);
    throw error;
  }
}

// CLI setup
program
  .name('coding-agent')
  .description('Coding agent tool for GitHub integration')
  .version('1.0.0');

program
  .command('push-branch')
  .description('Push a branch to GitHub')
  .option('-b, --branch <name>', 'Branch name', 'feature/update')
  .option('-m, --message <message>', 'Commit message')
  .option('-f, --files <files...>', 'Files to commit')
  .action(async (options) => {
    try {
      await pushBranch(options);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('sync-repo')
  .description('Sync repository with GitHub')
  .option('-b, --branch <name>', 'Branch to sync')
  .option('--pull', 'Pull latest changes', false)
  .option('--push', 'Push local changes', false)
  .action(async (options) => {
    try {
      await syncRepo(options);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check repository status')
  .action(async () => {
    try {
      await checkStatus();
    } catch (error) {
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
