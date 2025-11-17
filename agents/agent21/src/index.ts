/**
 * Agent 21: Universal Automation Builder
 * Main entry point for the live automation system generator
 */

import { AutomationBuilder } from './generator/builder';
import { TemplateEngine } from './generator/template-engine';
import { MCPGenerator } from './generator/mcp-generator';
import { DocumentationGenerator } from './generator/docs-generator';

export interface BuilderConfig {
  projectName: string;
  description: string;
  useCase: string;
  features: string[];
  integrations: string[];
  deployment: string;
  outputPath: string;
}

export class UniversalBuilder {
  private builder: AutomationBuilder;
  private templateEngine: TemplateEngine;
  private mcpGenerator: MCPGenerator;
  private docsGenerator: DocumentationGenerator;

  constructor() {
    this.builder = new AutomationBuilder();
    this.templateEngine = new TemplateEngine();
    this.mcpGenerator = new MCPGenerator();
    this.docsGenerator = new DocumentationGenerator();
  }

  /**
   * Generate a complete automation system based on user requirements
   */
  async generate(config: BuilderConfig): Promise<{ success: boolean; path: string; message: string }> {
    try {
      console.log(`🚀 Generating automation system: ${config.projectName}`);

      // Step 1: Generate project structure
      const projectPath = await this.builder.createProjectStructure(config);

      // Step 2: Generate templates based on use case
      await this.templateEngine.generateTemplates(config, projectPath);

      // Step 3: Generate MCP server
      await this.mcpGenerator.generateMCPServer(config, projectPath);

      // Step 4: Generate documentation
      await this.docsGenerator.generateDocs(config, projectPath);

      // Step 5: Initialize package.json and dependencies
      await this.builder.initializeProject(projectPath, config);

      console.log(`✅ System generated successfully at: ${projectPath}`);

      return {
        success: true,
        path: projectPath,
        message: `Automation system "${config.projectName}" created successfully!`
      };
    } catch (error) {
      console.error('❌ Generation failed:', error);
      return {
        success: false,
        path: '',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate configuration before generation
   */
  validateConfig(config: BuilderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.projectName || config.projectName.length < 3) {
      errors.push('Project name must be at least 3 characters');
    }

    if (!config.description) {
      errors.push('Description is required');
    }

    if (!config.useCase) {
      errors.push('Use case must be specified');
    }

    if (!config.features || config.features.length === 0) {
      errors.push('At least one feature must be selected');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default UniversalBuilder;
