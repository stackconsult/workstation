import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

export type GitOpResult = { stdout: string; stderr: string };

// Git branch naming pattern - alphanumeric, dots, underscores, hyphens, and slashes
const BRANCH_NAME_PATTERN = /^[a-zA-Z0-9._/-]+$/;

/**
 * Sanitize commit message - remove dangerous characters, limit length
 * @param msg - Raw commit message
 * @returns Sanitized message safe for git commit
 */
function sanitizeMessage(msg: string): string {
  // Remove dangerous characters, replace newlines with spaces, trim, and limit length
  return msg
    .replace(/[^\\w\\s.-]/g, '')
    .replace(/[\r\n]/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Validate branch name format
 * @param branch - Branch name to validate
 * @throws Error if branch name is invalid
 */
function validateBranchName(branch: string): void {
  if (!BRANCH_NAME_PATTERN.test(branch)) {
    throw new Error('Invalid branch name format. Use only alphanumeric characters, dots, underscores, hyphens, and slashes.');
  }
}

export async function gitAddAll(): Promise<GitOpResult> {
  return execFileAsync('git', ['add', '.']);
}

export async function gitCommit(message: string): Promise<GitOpResult> {
  const safe = sanitizeMessage(message || 'Automated commit');
  return execFileAsync('git', ['commit', '-m', safe]);
}

export async function gitPush(branch: string): Promise<GitOpResult> {
  const safeBranch = branch && branch.trim() ? branch.trim() : 'main';
  validateBranchName(safeBranch);
  return execFileAsync('git', ['push', 'origin', safeBranch]);
}

export async function gitCreateBranch(branch: string): Promise<GitOpResult> {
  const safeBranch = branch && branch.trim() ? branch.trim() : `gitops-${Date.now()}`;
  validateBranchName(safeBranch);
  return execFileAsync('git', ['checkout', '-b', safeBranch]);
}

export async function ghCreatePR(head: string, base = 'main', title?: string, body?: string): Promise<GitOpResult> {
  // Validate branch names
  validateBranchName(head);
  validateBranchName(base);
  
  // Sanitize PR title and body
  const safeTitle = sanitizeMessage(title || 'Automated PR');
  const safeBody = sanitizeMessage(body || 'Automated changes');
  
  const args = ['pr', 'create', '--head', head, '--base', base, '--title', safeTitle, '--body', safeBody];
  return execFileAsync('gh', args);
}

export type SafeRunResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
};

export async function safeRun(fn: () => Promise<GitOpResult>, operationName?: string): Promise<SafeRunResult> {
  try {
    const res = await fn();
    logger.info('GitOp succeeded', { operation: operationName || 'unknown', stdout: res.stdout });
    return { ok: true, stdout: res.stdout || '', stderr: res.stderr || '' };
  } catch (err: any) {
    const errorMessage = err.message || String(err);
    logger.error('GitOp failed', {
      operation: operationName || 'unknown',
      error: errorMessage,
      stderr: err.stderr, // execFile errors include stderr
      code: err.code
    });
    return { ok: false, stdout: '', stderr: errorMessage };
  }
}

export default {
  gitAddAll,
  gitCommit,
  gitPush,
  gitCreateBranch,
  ghCreatePR,
  safeRun,
};
