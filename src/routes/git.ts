import { Router, Request, Response, NextFunction } from "express";
import { authenticateToken, AuthenticatedRequest } from "../auth/jwt";
import { getGitService } from "../services/git";
import { logger } from "../utils/logger";
import Joi from "joi";

const router = Router();

// Validation schemas
const pushSchema = Joi.object({
  force: Joi.boolean().optional().default(false),
});

const createPRSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  head: Joi.string().required().min(1).max(100),
  base: Joi.string().optional().default("main").max(100),
  body: Joi.string().optional().allow("").max(10000),
});

const commitSchema = Joi.object({
  message: Joi.string().required().min(1).max(500),
  files: Joi.array().items(Joi.string()).optional(),
});

const listPRsSchema = Joi.object({
  state: Joi.string().valid("open", "closed", "all").optional().default("open"),
});

// Middleware to validate request body
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
};

// Middleware to validate query parameters
const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }
    req.query = value;
    next();
  };
};

/**
 * GET /api/v2/git/status
 * Get current repository status (branch, ahead/behind, file changes)
 */
router.get(
  "/git/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const gitService = getGitService(process.cwd(), githubToken);

      const status = await gitService.getStatus();
      const authReq = req as AuthenticatedRequest;

      logger.info("Git status retrieved", {
        user: authReq.user?.userId || "unknown",
        branch: status.current,
      });

      res.json({ success: true, data: status });
    } catch (error) {
      logger.error("Failed to get git status", { error });
      res.status(500).json({
        success: false,
        error: "Failed to get git status",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * GET /api/v2/git/branches
 * List all branches (local and remote)
 */
router.get(
  "/git/branches",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const gitService = getGitService(process.cwd(), githubToken);

      const branches = await gitService.listBranches();
      const authReq = req as AuthenticatedRequest;

      logger.info("Branches listed", {
        user: authReq.user?.userId || "unknown",
        count: branches.length,
      });

      res.json({ success: true, data: branches });
    } catch (error) {
      logger.error("Failed to list branches", { error });
      res.status(500).json({
        success: false,
        error: "Failed to list branches",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * POST /api/v2/git/push
 * Push current branch to remote
 */
router.post(
  "/git/push",
  authenticateToken,
  validateBody(pushSchema),
  async (req: Request, res: Response) => {
    try {
      const { force } = req.body;
      const githubToken = process.env.GITHUB_TOKEN;
      const gitService = getGitService(process.cwd(), githubToken);

      const result = await gitService.pushCurrentBranch(force);
      const authReq = req as AuthenticatedRequest;

      logger.info("Branch pushed", {
        user: authReq.user?.userId || "unknown",
        force,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Failed to push branch", { error });
      res.status(500).json({
        success: false,
        error: "Failed to push branch",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * GET /api/v2/git/prs
 * List pull requests from GitHub
 */
router.get(
  "/git/prs",
  authenticateToken,
  validateQuery(listPRsSchema),
  async (req: Request, res: Response) => {
    try {
      const { state } = req.query as { state: "open" | "closed" | "all" };
      const githubToken = process.env.GITHUB_TOKEN;

      if (!githubToken) {
        return res.status(400).json({
          success: false,
          error: "GitHub token not configured",
          message:
            "GITHUB_TOKEN environment variable must be set to use this endpoint",
        });
      }

      const gitService = getGitService(process.cwd(), githubToken);
      const prs = await gitService.listPullRequests(state);
      const authReq = req as AuthenticatedRequest;

      logger.info("Pull requests listed", {
        user: authReq.user?.userId || "unknown",
        state,
        count: prs.length,
      });

      res.json({ success: true, data: prs });
    } catch (error) {
      logger.error("Failed to list pull requests", { error });
      res.status(500).json({
        success: false,
        error: "Failed to list pull requests",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * POST /api/v2/git/pr
 * Create a new pull request
 */
router.post(
  "/git/pr",
  authenticateToken,
  validateBody(createPRSchema),
  async (req: Request, res: Response) => {
    try {
      const { title, head, base, body } = req.body;
      const githubToken = process.env.GITHUB_TOKEN;

      if (!githubToken) {
        return res.status(400).json({
          success: false,
          error: "GitHub token not configured",
          message:
            "GITHUB_TOKEN environment variable must be set to use this endpoint",
        });
      }

      const gitService = getGitService(process.cwd(), githubToken);
      const pr = await gitService.createPullRequest(title, head, base, body);
      const authReq = req as AuthenticatedRequest;

      logger.info("Pull request created", {
        user: authReq.user?.userId || "unknown",
        pr: pr.number,
        title,
        head,
        base,
      });

      res.json({ success: true, data: pr });
    } catch (error) {
      logger.error("Failed to create pull request", { error });
      res.status(500).json({
        success: false,
        error: "Failed to create pull request",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * POST /api/v2/git/sync
 * Sync repository (fetch, merge, push)
 */
router.post(
  "/git/sync",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const gitService = getGitService(process.cwd(), githubToken);

      const result = await gitService.syncRepository();
      const authReq = req as AuthenticatedRequest;

      logger.info("Repository sync completed", {
        user: authReq.user?.userId || "unknown",
        success: result.success,
        pulled: result.pulled,
        pushed: result.pushed,
      });

      const statusCode = result.success ? 200 : 409; // 409 for conflicts
      res.status(statusCode).json({ success: result.success, data: result });
    } catch (error) {
      logger.error("Failed to sync repository", { error });
      res.status(500).json({
        success: false,
        error: "Failed to sync repository",
        message: (error as Error).message,
      });
    }
  },
);

/**
 * POST /api/v2/git/commit
 * Commit changes to the repository
 */
router.post(
  "/git/commit",
  authenticateToken,
  validateBody(commitSchema),
  async (req: Request, res: Response) => {
    try {
      const { message, files } = req.body;
      const githubToken = process.env.GITHUB_TOKEN;
      const gitService = getGitService(process.cwd(), githubToken);

      const result = await gitService.commitChanges(message, files);
      const authReq = req as AuthenticatedRequest;

      logger.info("Changes committed", {
        user: authReq.user?.userId || "unknown",
        message,
        files: files || "all",
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Failed to commit changes", { error });
      res.status(500).json({
        success: false,
        error: "Failed to commit changes",
        message: (error as Error).message,
      });
    }
  },
);

export default router;
