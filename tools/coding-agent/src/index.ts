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
