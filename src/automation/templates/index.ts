/**
 * Pre-built Automation Templates
 * Provides reusable templates for common workflows
 * Phase 10: Workspace Automation
 */

import { logger } from "../../utils/logger";

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  description: string;
  defaultValue?: unknown;
  required?: boolean;
}

export interface WorkflowTask {
  name: string;
  agent_type: string;
  action: string;
  parameters: Record<string, unknown>;
}

export interface WorkflowDefinition {
  tasks: WorkflowTask[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: TemplateVariable[];
  definition: WorkflowDefinition;
  tags?: string[];
}

/**
 * Template Registry for managing automation templates
 */
export class TemplateRegistry {
  private templates: Map<string, AutomationTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    // Client Onboarding Template
    this.registerTemplate({
      id: "client-onboarding",
      name: "Client Onboarding",
      description: "Automates the complete client onboarding process",
      category: "sales",
      tags: ["onboarding", "sales", "automation"],
      variables: [
        {
          name: "clientName",
          type: "string",
          description: "Client company name",
          required: true,
        },
        {
          name: "contactEmail",
          type: "string",
          description: "Primary contact email",
          required: true,
        },
        {
          name: "startDate",
          type: "date",
          description: "Onboarding start date",
          defaultValue: new Date().toISOString(),
        },
      ],
      definition: {
        tasks: [
          {
            name: "create-client-folder",
            agent_type: "file",
            action: "createDirectory",
            parameters: {
              path: "clients/{{clientName}}",
            },
          },
          {
            name: "send-welcome-email",
            agent_type: "email",
            action: "sendEmail",
            parameters: {
              to: "{{contactEmail}}",
              subject: "Welcome to Our Services, {{clientName}}!",
              body: "Dear {{clientName}},\n\nThank you for choosing our services. Your onboarding starts on {{startDate}}.\n\nBest regards,\nThe Team",
            },
          },
        ],
      },
    });

    // Prospect Follow-up Template
    this.registerTemplate({
      id: "prospect-followup",
      name: "Prospect Follow-Up",
      description: "Automates follow-up communication with prospects",
      category: "sales",
      tags: ["followup", "sales", "prospects"],
      variables: [
        {
          name: "prospectName",
          type: "string",
          description: "Prospect name",
          required: true,
        },
        {
          name: "prospectEmail",
          type: "string",
          description: "Prospect email address",
          required: true,
        },
        {
          name: "lastContactDate",
          type: "date",
          description: "Date of last contact",
          required: true,
        },
      ],
      definition: {
        tasks: [
          {
            name: "check-previous-emails",
            agent_type: "email",
            action: "getUnreadEmails",
            parameters: {
              folder: "Inbox",
            },
          },
          {
            name: "send-followup-email",
            agent_type: "email",
            action: "sendEmail",
            parameters: {
              to: "{{prospectEmail}}",
              subject: "Following up on our conversation",
              body: "Hi {{prospectName}},\n\nI wanted to follow up on our conversation from {{lastContactDate}}.\n\nLooking forward to hearing from you.\n\nBest regards",
            },
          },
        ],
      },
    });

    // Client Intelligence Gathering Template
    this.registerTemplate({
      id: "client-intelligence",
      name: "Client Intelligence Gathering",
      description:
        "Monitors RSS feeds for client mentions and builds intelligence repository",
      category: "research",
      tags: ["intelligence", "research", "monitoring"],
      variables: [
        {
          name: "clientName",
          type: "string",
          description: "Client name to monitor",
          required: true,
        },
        {
          name: "rssFeedUrl",
          type: "string",
          description: "RSS feed URL to monitor",
          required: true,
        },
        {
          name: "feedName",
          type: "string",
          description: "Name of the RSS feed source",
          defaultValue: "Industry Feed",
        },
      ],
      definition: {
        tasks: [
          {
            name: "build-client-repository",
            agent_type: "rss",
            action: "buildClientRepository",
            parameters: {
              rssFeeds: [
                {
                  url: "{{rssFeedUrl}}",
                  sourceName: "{{feedName}}",
                },
              ],
              clientName: "{{clientName}}",
            },
          },
          {
            name: "save-intelligence-report",
            agent_type: "file",
            action: "writeFile",
            parameters: {
              path: "intelligence/{{clientName}}/latest.json",
              content: "{{repository}}",
            },
          },
        ],
      },
    });

    // Document Organization Template
    this.registerTemplate({
      id: "document-organization",
      name: "Document Organization",
      description: "Organizes documents into folders by type",
      category: "productivity",
      tags: ["organization", "files", "productivity"],
      variables: [
        {
          name: "sourcePath",
          type: "string",
          description: "Source directory path",
          required: true,
        },
        {
          name: "targetPath",
          type: "string",
          description: "Target directory path",
          required: true,
        },
      ],
      definition: {
        tasks: [
          {
            name: "list-source-files",
            agent_type: "file",
            action: "listFiles",
            parameters: {
              path: "{{sourcePath}}",
              recursive: false,
            },
          },
          {
            name: "create-target-folders",
            agent_type: "file",
            action: "createDirectory",
            parameters: {
              path: "{{targetPath}}",
            },
          },
        ],
      },
    });

    // Email Digest Template
    this.registerTemplate({
      id: "email-digest",
      name: "Email Digest Report",
      description: "Generates a summary of unread emails",
      category: "productivity",
      tags: ["email", "digest", "reporting"],
      variables: [
        {
          name: "recipientEmail",
          type: "string",
          description: "Email address to send digest",
          required: true,
        },
        {
          name: "daysBack",
          type: "number",
          description: "Number of days to include in digest",
          defaultValue: 7,
        },
      ],
      definition: {
        tasks: [
          {
            name: "fetch-unread-emails",
            agent_type: "email",
            action: "getUnreadEmails",
            parameters: {
              limit: 50,
            },
          },
          {
            name: "send-digest-email",
            agent_type: "email",
            action: "sendEmail",
            parameters: {
              to: "{{recipientEmail}}",
              subject: "Email Digest - Last {{daysBack}} Days",
              body: "Your email digest for the last {{daysBack}} days...",
            },
          },
        ],
      },
    });

    logger.info("Default templates registered", { count: this.templates.size });
  }

  /**
   * Register a template
   */
  registerTemplate(template: AutomationTemplate): void {
    this.templates.set(template.id, template);
    logger.info("Template registered", {
      id: template.id,
      name: template.name,
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): AutomationTemplate | null {
    const template = this.templates.get(id);
    return template || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): AutomationTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category,
    );
  }

  /**
   * Get all templates
   */
  getAllTemplates(): AutomationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const template of this.templates.values()) {
      categories.add(template.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Search templates by name or description
   */
  searchTemplates(query: string): AutomationTemplate[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (template) =>
        template.name.toLowerCase().includes(queryLower) ||
        template.description.toLowerCase().includes(queryLower) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(queryLower)),
    );
  }

  /**
   * Apply variables to template definition
   */
  applyVariables(
    definition: WorkflowDefinition,
    variables: Record<string, unknown>,
  ): WorkflowDefinition {
    const replaceVariables = (obj: unknown): unknown => {
      if (typeof obj === "string") {
        // Replace {{variable}} with actual values
        return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          const value = variables[key];
          return value !== undefined ? String(value) : `{{${key}}}`;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(replaceVariables);
      } else if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceVariables(value);
        }
        return result;
      }
      return obj;
    };

    return replaceVariables(definition) as WorkflowDefinition;
  }

  /**
   * Validate variables for template
   */
  validateVariables(
    templateId: string,
    variables: Record<string, unknown>,
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [`Template not found: ${templateId}`],
      };
    }

    const errors: string[] = [];

    // Check required variables
    for (const varDef of template.variables) {
      if (varDef.required && variables[varDef.name] === undefined) {
        errors.push(`Required variable missing: ${varDef.name}`);
      }

      // Type validation (basic)
      if (variables[varDef.name] !== undefined) {
        const value = variables[varDef.name];
        const actualType = Array.isArray(value) ? "array" : typeof value;

        if (
          actualType !== varDef.type &&
          !(varDef.type === "date" && typeof value === "string")
        ) {
          errors.push(
            `Variable ${varDef.name} expected type ${varDef.type}, got ${actualType}`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry();
