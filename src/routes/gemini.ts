import { Router, Request, Response, NextFunction } from "express";
import { getGeminiAdapter } from "../services/gemini-adapter";
import { z } from "zod";

const router = Router();

// Validation schemas
const NaturalWorkflowSchema = z.object({ prompt: z.string().min(1) });
const GenerateDisplaySchema = z.object({
  workflowResult: z.record(z.string(), z.unknown()),
});
const ChatSchema = z.object({
  messages: z.array(
    z.object({ role: z.enum(["user", "model"]), content: z.string() }),
  ),
});

// POST /api/gemini/natural-workflow
router.post(
  "/natural-workflow",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = NaturalWorkflowSchema.parse(req.body);
      const gemini = getGeminiAdapter();

      if (!gemini.isConfigured()) {
        return res
          .status(503)
          .json({ success: false, error: "Gemini API not configured" });
      }

      const workflow = await gemini.naturalLanguageToWorkflow(prompt);
      if (!workflow) {
        return res
          .status(422)
          .json({ success: false, error: "Could not generate workflow" });
      }

      res.json({ success: true, workflow });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.issues });
      }
      next(error);
    }
  },
);

// POST /api/gemini/generate-display
router.post(
  "/generate-display",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workflowResult } = GenerateDisplaySchema.parse(req.body);
      const gemini = getGeminiAdapter();

      if (!gemini.isConfigured()) {
        return res
          .status(503)
          .json({ success: false, error: "Gemini API not configured" });
      }

      const html = await gemini.generateDisplayUI(workflowResult);
      res.json({ success: true, html });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.issues });
      }
      next(error);
    }
  },
);

// POST /api/gemini/chat
router.post(
  "/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages } = ChatSchema.parse(req.body);
      const gemini = getGeminiAdapter();

      if (!gemini.isConfigured()) {
        return res
          .status(503)
          .json({ success: false, error: "Gemini API not configured" });
      }

      const response = await gemini.chat(messages);
      res.json({ success: true, response });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.issues });
      }
      next(error);
    }
  },
);

// GET /api/gemini/status
router.get("/status", (req: Request, res: Response) => {
  const gemini = getGeminiAdapter();
  res.json({
    success: true,
    configured: gemini.isConfigured(),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
});

export default router;
