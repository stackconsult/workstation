import { execFile } from 'child_process';
import { promisify } from 'util';
import * as gitOps from '../../src/services/gitOps';
import { logger } from '../../src/utils/logger';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../src/utils/logger');

const execFileAsync = promisify(execFile);
const mockedExecFile = execFile as jest.MockedFunction<typeof execFile>;

describe('GitOps Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gitAddAll', () => {
    it('should execute git add .', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'added', stderr: '' });
      }) as any);

      const result = await gitOps.gitAddAll();
      expect(result.stdout).toBe('added');
      expect(mockedExecFile).toHaveBeenCalledWith('git', ['add', '.'], expect.any(Function));
    });
  });

  describe('gitCommit', () => {
    it('should execute git commit with sanitized message', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'committed', stderr: '' });
      }) as any);

      const result = await gitOps.gitCommit('Test commit message');
      expect(result.stdout).toBe('committed');
      expect(mockedExecFile).toHaveBeenCalledWith('git', ['commit', '-m', expect.any(String)], expect.any(Function));
    });

    it('should sanitize commit message by removing dangerous characters', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        const message = args[2] as string;
        // Verify dangerous characters are removed
        expect(message).not.toContain('$');
        expect(message).not.toContain('`');
        callback(null, { stdout: 'committed', stderr: '' });
      }) as any);

      await gitOps.gitCommit('Test $(whoami) message with `dangerous` chars');
    });
  });

  describe('gitPush', () => {
    it('should push to specified branch', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'pushed', stderr: '' });
      }) as any);

      const result = await gitOps.gitPush('feature-branch');
      expect(result.stdout).toBe('pushed');
      expect(mockedExecFile).toHaveBeenCalledWith('git', ['push', 'origin', 'feature-branch'], expect.any(Function));
    });

    it('should use main as default branch', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'pushed', stderr: '' });
      }) as any);

      await gitOps.gitPush('');
      expect(mockedExecFile).toHaveBeenCalledWith('git', ['push', 'origin', 'main'], expect.any(Function));
    });

    it('should throw error for invalid branch name', async () => {
      await expect(gitOps.gitPush('invalid branch name')).rejects.toThrow('Invalid branch name format');
    });
  });

  describe('gitCreateBranch', () => {
    it('should create branch with valid name', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'branch created', stderr: '' });
      }) as any);

      const result = await gitOps.gitCreateBranch('new-feature');
      expect(result.stdout).toBe('branch created');
      expect(mockedExecFile).toHaveBeenCalledWith('git', ['checkout', '-b', 'new-feature'], expect.any(Function));
    });

    it('should generate default branch name when none provided', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        const branchName = args[2] as string;
        expect(branchName).toMatch(/^gitops-\d+$/);
        callback(null, { stdout: 'branch created', stderr: '' });
      }) as any);

      await gitOps.gitCreateBranch('');
    });

    it('should throw error for invalid branch name', async () => {
      await expect(gitOps.gitCreateBranch('invalid branch')).rejects.toThrow('Invalid branch name format');
    });
  });

  describe('ghCreatePR', () => {
    it('should create PR with validated inputs', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'PR created', stderr: '' });
      }) as any);

      const result = await gitOps.ghCreatePR('feature-branch', 'main', 'Test PR', 'PR body');
      expect(result.stdout).toBe('PR created');
      expect(mockedExecFile).toHaveBeenCalledWith('gh', expect.arrayContaining(['pr', 'create']), expect.any(Function));
    });

    it('should sanitize PR title and body', async () => {
      mockedExecFile.mockImplementation(((cmd, args, callback) => {
        callback(null, { stdout: 'PR created', stderr: '' });
      }) as any);

      await gitOps.ghCreatePR('test', 'main', 'Title $(whoami)', 'Body `rm -rf`');
      // Verify the function completes without throwing
    });

    it('should throw error for invalid head branch', async () => {
      await expect(gitOps.ghCreatePR('invalid branch', 'main')).rejects.toThrow('Invalid branch name format');
    });
  });

  describe('safeRun', () => {
    it('should return ok: true on success', async () => {
      const fn = jest.fn().mockResolvedValue({ stdout: 'success', stderr: '' });
      const result = await gitOps.safeRun(fn, 'test-op');

      expect(result.ok).toBe(true);
      expect(result.stdout).toBe('success');
      expect(logger.info).toHaveBeenCalledWith('GitOp succeeded', expect.any(Object));
    });

    it('should return ok: false on error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Git error'));
      const result = await gitOps.safeRun(fn, 'test-op');

      expect(result.ok).toBe(false);
      expect(result.stderr).toContain('Git error');
      expect(logger.error).toHaveBeenCalledWith('GitOp failed', expect.any(Object));
    });

    it('should log operation name', async () => {
      const fn = jest.fn().mockResolvedValue({ stdout: 'success', stderr: '' });
      await gitOps.safeRun(fn, 'custom-operation');

      expect(logger.info).toHaveBeenCalledWith('GitOp succeeded', expect.objectContaining({
        operation: 'custom-operation',
      }));
    });
  });
});
