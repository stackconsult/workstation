/**
 * Workflow Templates Index
 * Central registry for all pre-built workflow templates
 */

import { WorkflowTemplate } from './types';
import webScrapingTemplate from './web-scraping.json';
import formAutomationTemplate from './form-automation.json';
import dataProcessingTemplate from './data-processing.json';
import apiIntegrationTemplate from './api-integration.json';
import websiteMonitoringTemplate from './website-monitoring.json';
import ecommerceTemplate from './ecommerce-price-comparison.json';
import socialMediaTemplate from './social-media-automation.json';
import reportGenerationTemplate from './report-generation.json';

// All available workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  webScrapingTemplate as WorkflowTemplate,
  formAutomationTemplate as WorkflowTemplate,
  dataProcessingTemplate as WorkflowTemplate,
  apiIntegrationTemplate as WorkflowTemplate,
  websiteMonitoringTemplate as WorkflowTemplate,
  ecommerceTemplate as WorkflowTemplate,
  socialMediaTemplate as WorkflowTemplate,
  reportGenerationTemplate as WorkflowTemplate,
];

// Category metadata
export const TEMPLATE_CATEGORIES = [
  {
    id: 'scraping',
    name: 'Web Scraping',
    description: 'Extract data from websites',
    icon: '🌐',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'scraping').length
  },
  {
    id: 'automation',
    name: 'Form Automation',
    description: 'Automate form filling and submissions',
    icon: '📝',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'automation').length
  },
  {
    id: 'data-processing',
    name: 'Data Processing',
    description: 'Transform and process data',
    icon: '⚙️',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'data-processing').length
  },
  {
    id: 'integration',
    name: 'API Integration',
    description: 'Connect with external APIs',
    icon: '🔌',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'integration').length
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Monitor websites and services',
    icon: '📊',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'monitoring').length
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Price tracking and product monitoring',
    icon: '🛒',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'ecommerce').length
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Automate social media tasks',
    icon: '📱',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'social-media').length
  },
  {
    id: 'reporting',
    name: 'Reporting',
    description: 'Generate automated reports',
    icon: '📈',
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === 'reporting').length
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get templates by complexity level
 */
export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.complexity === complexity);
}
