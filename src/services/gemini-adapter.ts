import axios, { AxiosInstance } from "axios";
import { createLogger } from "winston";
import { z } from "zod";

// Validation schemas
const WorkflowTaskSchema = z.object({
  name: z.string(),
  agent_type: z.string().default("browser"),
  action: z.string(),
  parameters: z.record(z.string(), z.unknown()),
});

const GeneratedWorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  tasks: z.array(WorkflowTaskSchema),
});

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export type GeneratedWorkflow = z.infer<typeof GeneratedWorkflowSchema>;

interface GeminiConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
});

export class GeminiAdapter {
  private config: GeminiConfig;
  private client: AxiosInstance;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.GEMINI_API_KEY || "",
      model: config?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash",
      endpoint:
        config?.endpoint ||
        process.env.GEMINI_ENDPOINT ||
        "https://generativelanguage.googleapis.com/v1beta",
    };

    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey !== "changeme";
  }

  async naturalLanguageToWorkflow(
    userPrompt: string,
  ): Promise<GeneratedWorkflow | null> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key not configured");
    }

    const systemPrompt = `You are a workflow builder for browser automation.
Convert user requests into valid workflow JSON.

Available actions:
- navigate: {url: string}
- click: {selector: string}
- type: {selector: string, text: string}
- screenshot: {fullPage?: boolean}
- getText: {selector: string}
- evaluate: {code: string}
- waitForSelector: {selector: string, timeout?: number}

Output ONLY valid JSON:
{
  "name": "Workflow Name",
  "description": "Description",
  "tasks": [{"name": "task_name", "agent_type": "browser", "action": "action_name", "parameters": {}}]
}`;

    try {
      const response = await this.client.post(
        `/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          contents: [
            { parts: [{ text: `${systemPrompt}\n\nUser: ${userPrompt}` }] },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        },
      );

      const text =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch =
        text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) return null;

      const parsed = JSON.parse((jsonMatch[1] || jsonMatch[0]).trim());
      return GeneratedWorkflowSchema.parse(parsed);
    } catch (error) {
      logger.error("Gemini naturalLanguageToWorkflow error:", error);
      throw error;
    }
  }

  async generateDisplayUI(
    workflowResult: Record<string, unknown>,
  ): Promise<string> {
    if (!this.isConfigured()) throw new Error("Gemini API not configured");

    const prompt = `Generate HTML with Tailwind CSS to display this workflow result. Dark theme. Return ONLY HTML.
Result: ${JSON.stringify(workflowResult, null, 2)}`;

    const response = await this.client.post(
      `/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      },
    );

    return (response.data.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .replace(/```(?:html)?\s*/g, "")
      .replace(/```\s*$/g, "")
      .trim();
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    if (!this.isConfigured()) throw new Error("Gemini API not configured");

    const response = await this.client.post(
      `/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        contents: messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      },
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

let instance: GeminiAdapter | null = null;
export const getGeminiAdapter = (): GeminiAdapter => {
  if (!instance) instance = new GeminiAdapter();
  return instance;
};

export default GeminiAdapter;
