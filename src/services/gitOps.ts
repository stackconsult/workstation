import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

export type GitOpResult = { stdout: string; stderr: string };

function sanitizeMessage(msg: string): string {
  return msg.replace(/['"\\]/g, '');
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
  return execFileAsync('git', ['push', 'origin', safeBranch]);
}

export async function gitCreateBranch(branch: string): Promise<GitOpResult> {
  const safeBranch = branch && branch.trim() ? branch.trim() : `gitops-${Date.now()}`;
  return execFileAsync('git', ['checkout', '-b', safeBranch]);
}

export async function ghCreatePR(head: string, base = 'main', title?: string, body?: string): Promise<GitOpResult> {
  const args = ['pr', 'create', '--head', head, '--base', base, '--title', title || 'Automated PR', '--body', body || 'Automated changes'];
  return execFileAsync('gh', args);
}

export async function safeRun(fn: () => Promise<GitOpResult>) {
  try {
    const res = await fn();
    return { ok: true, stdout: res.stdout || '', stderr: res.stderr || '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('GitOp failed', { error: message });
    return { ok: false, stdout: '', stderr: message };
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
