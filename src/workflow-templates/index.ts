/**
 * Workflow Templates Index
 * Central registry for all pre-built workflow templates
 * Phase 4 Enhanced - 32 production-ready templates
 */

import { WorkflowTemplate } from "./types";

// Original templates
import webScrapingTemplate from "./web-scraping.json";
import formAutomationTemplate from "./form-automation.json";
import dataProcessingTemplate from "./data-processing.json";
import apiIntegrationTemplate from "./api-integration.json";
import websiteMonitoringTemplate from "./website-monitoring.json";
import ecommerceTemplate from "./ecommerce-price-comparison.json";
import socialMediaTemplate from "./social-media-automation.json";
import reportGenerationTemplate from "./report-generation.json";
import loginAutomationTemplate from "./login-automation.json";
import multiPageScrapingTemplate from "./multi-page-scraping.json";
import pdfGenerationTemplate from "./pdf-generation.json";
import screenshotCaptureTemplate from "./screenshot-capture.json";
import slackNotificationTemplate from "./slack-notification.json";
import emailAutomationTemplate from "./email-automation.json";
import databaseExportTemplate from "./database-export.json";
import competitorMonitoringTemplate from "./competitor-monitoring.json";

// Advanced web scraping templates
import advancedPaginationTemplate from "./advanced-pagination-scraping.json";
import authenticatedScrapingTemplate from "./authenticated-scraping.json";

// Testing & QA automation templates
import e2eTestingTemplate from "./e2e-testing-automation.json";
import visualRegressionTemplate from "./visual-regression-testing.json";
import loadPerformanceTemplate from "./load-performance-testing.json";

// DevOps automation templates
import cicdPipelineTemplate from "./ci-cd-pipeline-automation.json";
import infrastructureMonitoringTemplate from "./infrastructure-monitoring.json";
import automatedBackupTemplate from "./automated-backup-recovery.json";
import securityVulnerabilityTemplate from "./security-vulnerability-scanning.json";

// Business process automation templates
import invoiceProcessingTemplate from "./invoice-processing-automation.json";
import employeeOnboardingTemplate from "./employee-onboarding-automation.json";
import customerSupportTemplate from "./customer-support-automation.json";

// Data processing templates
import etlPipelineTemplate from "./etl-data-pipeline.json";
import mlTrainingPipelineTemplate from "./ml-model-training-pipeline.json";

// Multi-API integration templates
import multiApiOrchestrationTemplate from "./multi-api-orchestration.json";

// Monitoring templates
import seoMonitoringTemplate from "./seo-monitoring-automation.json";

// All available workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Original templates (16)
  webScrapingTemplate as WorkflowTemplate,
  formAutomationTemplate as WorkflowTemplate,
  dataProcessingTemplate as WorkflowTemplate,
  apiIntegrationTemplate as WorkflowTemplate,
  websiteMonitoringTemplate as WorkflowTemplate,
  ecommerceTemplate as WorkflowTemplate,
  socialMediaTemplate as WorkflowTemplate,
  reportGenerationTemplate as WorkflowTemplate,
  loginAutomationTemplate as WorkflowTemplate,
  multiPageScrapingTemplate as WorkflowTemplate,
  pdfGenerationTemplate as WorkflowTemplate,
  screenshotCaptureTemplate as WorkflowTemplate,
  slackNotificationTemplate as WorkflowTemplate,
  emailAutomationTemplate as WorkflowTemplate,
  databaseExportTemplate as WorkflowTemplate,
  competitorMonitoringTemplate as WorkflowTemplate,

  // Advanced web scraping (2)
  advancedPaginationTemplate as WorkflowTemplate,
  authenticatedScrapingTemplate as WorkflowTemplate,

  // Testing & QA (3)
  e2eTestingTemplate as WorkflowTemplate,
  visualRegressionTemplate as WorkflowTemplate,
  loadPerformanceTemplate as WorkflowTemplate,

  // DevOps (4)
  cicdPipelineTemplate as WorkflowTemplate,
  infrastructureMonitoringTemplate as WorkflowTemplate,
  automatedBackupTemplate as WorkflowTemplate,
  securityVulnerabilityTemplate as WorkflowTemplate,

  // Business process (3)
  invoiceProcessingTemplate as WorkflowTemplate,
  employeeOnboardingTemplate as WorkflowTemplate,
  customerSupportTemplate as WorkflowTemplate,

  // Data processing (2)
  etlPipelineTemplate as WorkflowTemplate,
  mlTrainingPipelineTemplate as WorkflowTemplate,

  // Multi-API integration (1)
  multiApiOrchestrationTemplate as WorkflowTemplate,

  // Monitoring (1)
  seoMonitoringTemplate as WorkflowTemplate,
];

// Category metadata
export const TEMPLATE_CATEGORIES = [
  {
    id: "scraping",
    name: "Web Scraping",
    description: "Extract data from websites",
    icon: "🌐",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "scraping")
      .length,
  },
  {
    id: "automation",
    name: "Form Automation",
    description: "Automate form filling and submissions",
    icon: "📝",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "automation")
      .length,
  },
  {
    id: "data-processing",
    name: "Data Processing",
    description: "Transform and process data",
    icon: "⚙️",
    templateCount: WORKFLOW_TEMPLATES.filter(
      (t) => t.category === "data-processing",
    ).length,
  },
  {
    id: "integration",
    name: "API Integration",
    description: "Connect with external APIs",
    icon: "🔌",
    templateCount: WORKFLOW_TEMPLATES.filter(
      (t) => t.category === "integration",
    ).length,
  },
  {
    id: "monitoring",
    name: "Monitoring",
    description: "Monitor websites and services",
    icon: "📊",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "monitoring")
      .length,
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Price tracking and product monitoring",
    icon: "🛒",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "ecommerce")
      .length,
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Automate social media tasks",
    icon: "📱",
    templateCount: WORKFLOW_TEMPLATES.filter(
      (t) => t.category === "social-media",
    ).length,
  },
  {
    id: "reporting",
    name: "Reporting",
    description: "Generate automated reports",
    icon: "📈",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "reporting")
      .length,
  },
  {
    id: "testing",
    name: "Testing & QA",
    description: "Automated testing and quality assurance",
    icon: "🧪",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "testing")
      .length,
  },
  {
    id: "devops",
    name: "DevOps",
    description: "CI/CD, infrastructure, and deployment automation",
    icon: "🚀",
    templateCount: WORKFLOW_TEMPLATES.filter((t) => t.category === "devops")
      .length,
  },
  {
    id: "business-process",
    name: "Business Process",
    description: "Automate business workflows and processes",
    icon: "💼",
    templateCount: WORKFLOW_TEMPLATES.filter(
      (t) => t.category === "business-process",
    ).length,
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}

/**
 * Get templates by complexity level
 */
export function getTemplatesByComplexity(
  complexity: "beginner" | "intermediate" | "advanced",
): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.complexity === complexity);
}
