import simpleGit, { SimpleGit, StatusResult, BranchSummary } from "simple-git";
import { Octokit } from "@octokit/rest";
import { logger } from "../utils/logger";

export interface GitStatus {
  current: string;
  ahead: number;
  behind: number;
  files: {
    staged: string[];
    modified: string[];
    untracked: string[];
  };
  tracking?: string;
  isClean: boolean;
}

export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  head: string;
  base: string;
  url: string;
  created_at: string;
  updated_at: string;
  user: string;
}

export interface SyncResult {
  success: boolean;
  pulled: boolean;
  pushed: boolean;
  conflicts?: string[];
  message: string;
}

export class GitService {
  private git: SimpleGit;
  private octokit: Octokit | null = null;
  private repoOwner: string = "creditXcredit";
  private repoName: string = "workstation";
  private repoPath: string;

  constructor(repoPath: string, githubToken?: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);

    if (githubToken) {
      this.octokit = new Octokit({ auth: githubToken });
      logger.info("GitService initialized with GitHub token");
    } else {
      logger.warn(
        "GitService initialized without GitHub token - PR operations will not be available",
      );
    }
  }

  /**
   * Get current repository status including branch, ahead/behind, and file changes
   */
  async getStatus(): Promise<GitStatus> {
    try {
      const status: StatusResult = await this.git.status();

      return {
        current: status.current || "unknown",
        ahead: status.ahead,
        behind: status.behind,
        files: {
          staged: status.staged,
          modified: status.modified,
          untracked: status.not_added,
        },
        tracking: status.tracking || undefined,
        isClean: status.isClean(),
      };
    } catch (error) {
      logger.error("Failed to get git status", { error });
      throw new Error(`Failed to get git status: ${(error as Error).message}`);
    }
  }

  /**
   * List all branches (local and remote)
   */
  async listBranches(): Promise<BranchInfo[]> {
    try {
      const branchSummary: BranchSummary = await this.git.branch(["-a"]);

      return Object.entries(branchSummary.branches).map(([name, branch]) => ({
        name,
        current: branch.current,
        commit: branch.commit,
        label: branch.label,
      }));
    } catch (error) {
      logger.error("Failed to list branches", { error });
      throw new Error(`Failed to list branches: ${(error as Error).message}`);
    }
  }

  /**
   * Push current branch to remote
   */
  async pushCurrentBranch(
    force: boolean = false,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getStatus();
      const currentBranch = status.current;

      if (!currentBranch || currentBranch === "unknown") {
        throw new Error("Cannot determine current branch");
      }

      // Ensure remote is set correctly
      await this.ensureRemote();

      const options = force ? ["--force"] : [];
      await this.git.push("origin", currentBranch, options);

      logger.info("Successfully pushed branch", {
        branch: currentBranch,
        force,
      });

      return {
        success: true,
        message: `Successfully pushed branch '${currentBranch}' to origin`,
      };
    } catch (error) {
      logger.error("Failed to push branch", { error });
      throw new Error(`Failed to push branch: ${(error as Error).message}`);
    }
  }

  /**
   * List pull requests from GitHub
   */
  async listPullRequests(
    state: "open" | "closed" | "all" = "open",
  ): Promise<PullRequest[]> {
    if (!this.octokit) {
      throw new Error(
        "GitHub token not configured - cannot fetch pull requests",
      );
    }

    try {
      const { data } = await this.octokit.pulls.list({
        owner: this.repoOwner,
        repo: this.repoName,
        state,
        per_page: 100,
      });

      return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        head: pr.head.ref,
        base: pr.base.ref,
        url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        user: pr.user?.login || "unknown",
      }));
    } catch (error) {
      logger.error("Failed to list pull requests", { error });
      throw new Error(
        `Failed to list pull requests: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Create a new pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string = "main",
    body?: string,
  ): Promise<PullRequest> {
    if (!this.octokit) {
      throw new Error(
        "GitHub token not configured - cannot create pull request",
      );
    }

    try {
      // First, ensure the branch is pushed
      await this.git.push("origin", head);

      const { data } = await this.octokit.pulls.create({
        owner: this.repoOwner,
        repo: this.repoName,
        title,
        head,
        base,
        body: body || "",
      });

      logger.info("Created pull request", {
        number: data.number,
        title,
        head,
        base,
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        head: data.head.ref,
        base: data.base.ref,
        url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: data.user?.login || "unknown",
      };
    } catch (error) {
      logger.error("Failed to create pull request", { error });
      throw new Error(
        `Failed to create pull request: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Sync repository (fetch, merge, push)
   */
  async syncRepository(): Promise<SyncResult> {
    try {
      const status = await this.getStatus();
      const currentBranch = status.current;

      if (!status.isClean) {
        return {
          success: false,
          pulled: false,
          pushed: false,
          message:
            "Working directory is not clean. Commit or stash changes first.",
        };
      }

      // Fetch from remote
      await this.git.fetch("origin", currentBranch);
      logger.info("Fetched from origin", { branch: currentBranch });

      // Pull changes
      let pulled = false;
      if (status.behind > 0) {
        await this.git.pull("origin", currentBranch);
        pulled = true;
        logger.info("Pulled changes from origin", { branch: currentBranch });
      }

      // Push changes
      let pushed = false;
      const newStatus = await this.getStatus();
      if (newStatus.ahead > 0) {
        await this.git.push("origin", currentBranch);
        pushed = true;
        logger.info("Pushed changes to origin", { branch: currentBranch });
      }

      return {
        success: true,
        pulled,
        pushed,
        message: `Sync completed. Pulled: ${pulled}, Pushed: ${pushed}`,
      };
    } catch (error) {
      logger.error("Failed to sync repository", { error });

      const errorMessage = (error as Error).message;
      const conflicts = errorMessage.includes("CONFLICT")
        ? this.extractConflicts(errorMessage)
        : undefined;

      return {
        success: false,
        pulled: false,
        pushed: false,
        conflicts,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Ensure the remote is set to the correct repository
   */
  private async ensureRemote(): Promise<void> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === "origin");

      const expectedUrl = `https://github.com/${this.repoOwner}/${this.repoName}.git`;

      if (!origin) {
        await this.git.addRemote("origin", expectedUrl);
        logger.info("Added origin remote", { url: expectedUrl });
      } else if (
        origin.refs.push !== expectedUrl &&
        origin.refs.fetch !== expectedUrl
      ) {
        logger.warn("Origin remote URL mismatch", {
          expected: expectedUrl,
          actual: origin.refs.push,
        });
        // Optionally update the remote URL
        await this.git.remote(["set-url", "origin", expectedUrl]);
        logger.info("Updated origin remote URL", { url: expectedUrl });
      }
    } catch (error) {
      logger.error("Failed to ensure remote", { error });
      throw error;
    }
  }

  /**
   * Extract conflict files from error message
   */
  private extractConflicts(errorMessage: string): string[] {
    const conflictPattern = /CONFLICT \(.*?\): (.+)/g;
    const conflicts: string[] = [];
    let match;

    while ((match = conflictPattern.exec(errorMessage)) !== null) {
      conflicts.push(match[1]);
    }

    return conflicts;
  }

  /**
   * Add and commit changes
   */
  async commitChanges(
    message: string,
    files?: string[],
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (files && files.length > 0) {
        await this.git.add(files);
      } else {
        await this.git.add(".");
      }

      await this.git.commit(message);

      logger.info("Committed changes", { message, files: files || "all" });

      return {
        success: true,
        message: `Successfully committed changes: ${message}`,
      };
    } catch (error) {
      logger.error("Failed to commit changes", { error });
      throw new Error(`Failed to commit changes: ${(error as Error).message}`);
    }
  }
}

// Singleton instance
let gitServiceInstance: GitService | null = null;

export function getGitService(
  repoPath?: string,
  githubToken?: string,
): GitService {
  if (!gitServiceInstance) {
    const path = repoPath || process.cwd();
    gitServiceInstance = new GitService(path, githubToken);
  }
  return gitServiceInstance;
}
