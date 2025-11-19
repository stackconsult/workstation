import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import gitOps from '../services/gitOps';
import { authenticateToken } from '../auth/jwt';
import { validateRequest, schemas } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiter for GitOps operations (more restrictive than general API)
const gitopsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Lower limit for resource-intensive git operations
  message: 'Too many git operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /add-commit-push
 * Automated git add, commit, push, and optionally create PR
 * 
 * @requires JWT authentication
 * @requires Request body validation
 * @ratelimit 20 requests per 15 minutes
 */
router.post(
  '/add-commit-push',
  gitopsLimiter,
  authenticateToken,
  validateRequest(schemas.gitOpsRequest),
  async (req: Request, res: Response) => {
    const { branch, message, createBranch, createPR } = req.body || {};

    logger.info('GitOps operation started', {
      user: (req as any).user?.userId,
      branch,
      createBranch: !!createBranch,
      createPR: !!createPR,
    });

    try {
      // Track the actual branch being used for all operations
      let actualBranch = branch || 'main';

      // Step 1: Create branch if requested
      if (createBranch) {
        actualBranch = branch || `gitops-${Date.now()}`;
        const cb = await gitOps.safeRun(() => gitOps.gitCreateBranch(actualBranch), 'git-create-branch');
        if (!cb.ok) {
          logger.warn('GitOps branch creation failed', { branch: actualBranch, error: cb.stderr });
          return res.status(500).json({
            success: false,
            error: cb.stderr || 'Failed to create branch',
          });
        }
      }

      // Step 2: Git add all changes
      const add = await gitOps.safeRun(() => gitOps.gitAddAll(), 'git-add');
      if (!add.ok) {
        logger.warn('GitOps git add failed', { error: add.stderr });
        return res.status(500).json({
          success: false,
          error: add.stderr || 'Failed to add files',
        });
      }

      // Step 3: Commit changes
      const commit = await gitOps.safeRun(
        () => gitOps.gitCommit(message || 'Automated commit'),
        'git-commit'
      );
      if (!commit.ok) {
        logger.warn('GitOps commit failed', { error: commit.stderr });
        return res.status(500).json({
          success: false,
          error: commit.stderr || 'Failed to commit',
        });
      }

      // Step 4: Push to remote using the actual branch
      const push = await gitOps.safeRun(() => gitOps.gitPush(actualBranch), 'git-push');
      if (!push.ok) {
        logger.warn('GitOps push failed', { branch: actualBranch, error: push.stderr });
        return res.status(500).json({
          success: false,
          error: push.stderr || 'Failed to push',
        });
      }

      // Step 5: Create PR if requested
      let prResult = null;
      if (createPR) {
        const headBranch = createPR === true ? actualBranch : createPR;
        prResult = await gitOps.safeRun(() => gitOps.ghCreatePR(headBranch), 'gh-create-pr');
        if (!prResult.ok) {
          logger.warn('GitOps PR creation failed', { head: headBranch, error: prResult.stderr });
          return res.status(500).json({
            success: false,
            error: prResult.stderr || 'Failed to create PR',
          });
        }
      }

      logger.info('GitOps operation completed successfully', {
        user: (req as any).user?.userId,
        branch: actualBranch,
      });

      return res.json({
        success: true,
        data: { add, commit, push, pr: prResult },
      });
    } catch (err: any) {
      logger.error('GitOps operation failed', {
        user: (req as any).user?.userId,
        error: err.message,
      });
      return res.status(500).json({
        success: false,
        error: err.message || String(err),
      });
    }
  }
);

export default router;
