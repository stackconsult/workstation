import { Router, Request, Response } from "express";
import gitOps from "../services/gitOps";

const router = Router();

function requireToken(req: Request) {
  const token = process.env.GITOPS_TOKEN;
  if (!token) return false;
  const header = req.header("x-gitops-token") || req.header("X-GitOps-Token");
  return header === token;
}

router.post("/add-commit-push", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== "test" && !requireToken(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { branch, message, createBranch, createPR } = req.body || {};

  try {
    if (createBranch) {
      const br = branch || `gitops-${Date.now()}`;
      const cb = await gitOps.safeRun(() => gitOps.gitCreateBranch(br));
      if (!cb.ok) return res.status(500).json(cb);
    }

    const add = await gitOps.safeRun(() => gitOps.gitAddAll());
    if (!add.ok) return res.status(500).json(add);

    const commit = await gitOps.safeRun(() =>
      gitOps.gitCommit(message || "Automated commit"),
    );
    if (!commit.ok) return res.status(500).json(commit);

    const push = await gitOps.safeRun(() => gitOps.gitPush(branch || "main"));
    if (!push.ok) return res.status(500).json(push);

    let prResult = null;
    if (createPR) {
      prResult = await gitOps.safeRun(() =>
        gitOps.ghCreatePR(createPR === true ? branch || "main" : createPR),
      );
      if (!prResult.ok) return res.status(500).json(prResult);
    }

    return res.json({ add, commit, push, pr: prResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
});

export default router;
