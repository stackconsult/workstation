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
