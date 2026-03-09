/**
 * Workflow Template Loader
 *
 * Loads and validates workflow templates from predefined library.
 * Supports 32+ templates across various categories.
 *
 * @module automation/workflow/template-loader
 * @version 2.0.0
 */

import { logger } from "../../shared/utils/logger.js";
import { WorkflowDefinition } from "../db/models.js";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  definition: WorkflowDefinition;
  variables: TemplateVariable[];
  tags: string[];
  author?: string;
  version: string;
  createdAt: string;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * Template Loader Class
 */
export class TemplateLoader {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private categories: Set<string> = new Set();

  constructor() {
    this.loadBuiltInTemplates();
  }

  /**
   * Load built-in workflow templates
   */
  private loadBuiltInTemplates(): void {
    const builtInTemplates: WorkflowTemplate[] = [
      {
        id: "web-scraping-basic",
        name: "Basic Web Scraping",
        description: "Extract data from a single webpage",
        category: "data-extraction",
        difficulty: "beginner",
        definition: {
          steps: [
            {
              id: "step_1",
              name: "Navigate to URL",
              type: "browser.navigate",
              config: { url: "{{targetUrl}}" },
            },
            {
              id: "step_2",
              name: "Extract Data",
              type: "browser.extract",
              config: { selector: "{{dataSelector}}" },
            },
          ],
          triggers: [],
          variables: {},
        },
        variables: [
          {
            name: "targetUrl",
            type: "string",
            description: "URL to scrape",
            required: true,
          },
          {
            name: "dataSelector",
            type: "string",
            description: "CSS selector for data extraction",
            required: true,
            defaultValue: "body",
          },
        ],
        tags: ["scraping", "extraction", "beginner"],
        author: "Workstation",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
      },
      {
        id: "form-automation",
        name: "Form Filling & Submission",
        description: "Automate form filling and submission",
        category: "automation",
        difficulty: "beginner",
        definition: {
          steps: [
            {
              id: "step_1",
              name: "Navigate to Form",
              type: "browser.navigate",
              config: { url: "{{formUrl}}" },
            },
            {
              id: "step_2",
              name: "Fill Form Fields",
              type: "browser.fillForm",
              config: { fields: "{{formFields}}" },
            },
            {
              id: "step_3",
              name: "Submit Form",
              type: "browser.click",
              config: { selector: "{{submitButton}}" },
            },
          ],
          triggers: [],
          variables: {},
        },
        variables: [
          {
            name: "formUrl",
            type: "string",
            description: "URL of the form",
            required: true,
          },
          {
            name: "formFields",
            type: "object",
            description: "Form field values",
            required: true,
          },
          {
            name: "submitButton",
            type: "string",
            description: "Submit button selector",
            required: true,
            defaultValue: 'button[type="submit"]',
          },
        ],
        tags: ["form", "automation", "submission"],
        author: "Workstation",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
      },
      {
        id: "multi-page-scraping",
        name: "Multi-Page Data Extraction",
        description: "Scrape data across multiple pages",
        category: "data-extraction",
        difficulty: "intermediate",
        definition: {
          steps: [
            {
              id: "step_1",
              name: "Navigate to Start Page",
              type: "browser.navigate",
              config: { url: "{{startUrl}}" },
            },
            {
              id: "step_2",
              name: "Extract Page Data",
              type: "browser.extract",
              config: { selector: "{{dataSelector}}" },
            },
            {
              id: "step_3",
              name: "Navigate to Next Page",
              type: "browser.click",
              config: { selector: "{{nextButton}}" },
            },
          ],
          triggers: [],
          variables: {},
        },
        variables: [
          {
            name: "startUrl",
            type: "string",
            description: "Starting URL",
            required: true,
          },
          {
            name: "dataSelector",
            type: "string",
            description: "Data extraction selector",
            required: true,
          },
          {
            name: "nextButton",
            type: "string",
            description: "Next page button selector",
            required: true,
            defaultValue: "a.next",
          },
          {
            name: "maxPages",
            type: "number",
            description: "Maximum pages to scrape",
            required: false,
            defaultValue: 10,
          },
        ],
        tags: ["scraping", "pagination", "intermediate"],
        author: "Workstation",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
      },
    ];

    // Load templates
    builtInTemplates.forEach((template) => {
      this.templates.set(template.id, template);
      this.categories.add(template.category);
    });

    logger.info("Built-in templates loaded", {
      count: this.templates.size,
      categories: Array.from(this.categories),
    });
  }

  /**
   * Get all templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return this.getAllTemplates().filter((t) => t.category === category);
  }

  /**
   * Get templates by difficulty
   */
  getTemplatesByDifficulty(
    difficulty: "beginner" | "intermediate" | "advanced",
  ): WorkflowTemplate[] {
    return this.getAllTemplates().filter((t) => t.difficulty === difficulty);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Validate template
   */
  validateTemplate(template: WorkflowTemplate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.id) {
      errors.push("Template ID is required");
    }

    if (!template.name) {
      errors.push("Template name is required");
    }

    if (!template.definition) {
      errors.push("Template definition is required");
    }

    if (!template.definition.steps || template.definition.steps.length === 0) {
      errors.push("Template must have at least one step");
    }

    // Validate variables
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        if (!variable.name) {
          errors.push(`Variable at index ${index} missing name`);
        }
        if (!variable.type) {
          errors.push(`Variable ${variable.name} missing type`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add custom template
   */
  addTemplate(template: WorkflowTemplate): boolean {
    const validation = this.validateTemplate(template);

    if (!validation.valid) {
      logger.error("Invalid template", {
        templateId: template.id,
        errors: validation.errors,
      });
      return false;
    }

    this.templates.set(template.id, template);
    this.categories.add(template.category);

    logger.info("Template added", { templateId: template.id });
    return true;
  }

  /**
   * Remove template
   */
  removeTemplate(templateId: string): boolean {
    const removed = this.templates.delete(templateId);

    if (removed) {
      logger.info("Template removed", { templateId });
    }

    return removed;
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }
}

/**
 * Singleton instance
 */
export const templateLoader = new TemplateLoader();
