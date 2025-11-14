import { Workflow } from '@/types';

/**
 * Pre-built workflow templates for common tasks
 */

export const priceComparisonWorkflow: Workflow = {
  id: 'price-comparison',
  name: 'Price Comparison',
  description: 'Compare product prices across multiple websites',
  initialStep: 'navigate-1',
  steps: [
    {
      id: 'navigate-1',
      type: 'navigate',
      config: {
        url: '$site1Url',
      },
      nextSteps: ['extract-1'],
    },
    {
      id: 'extract-1',
      type: 'extract',
      config: {
        selector: '.price',
        extractType: 'text',
      },
      nextSteps: ['navigate-2'],
    },
    {
      id: 'navigate-2',
      type: 'navigate',
      config: {
        url: '$site2Url',
      },
      nextSteps: ['extract-2'],
    },
    {
      id: 'extract-2',
      type: 'extract',
      config: {
        selector: '.price',
        extractType: 'text',
      },
      nextSteps: ['analyze'],
    },
    {
      id: 'analyze',
      type: 'analyze',
      config: {
        data: {
          site1: '$step_extract-1',
          site2: '$step_extract-2',
        },
        analysisType: 'price-comparison',
      },
    },
  ],
};

export const contentAggregationWorkflow: Workflow = {
  id: 'content-aggregation',
  name: 'Content Aggregation',
  description: 'Collect and summarize articles from a news site',
  initialStep: 'extract-links',
  steps: [
    {
      id: 'extract-links',
      type: 'extract',
      config: {
        selector: 'a.article-link',
        extractType: 'href',
      },
      nextSteps: ['loop-articles'],
    },
    {
      id: 'loop-articles',
      type: 'loop',
      config: {
        items: '$step_extract-links',
        subStep: 'process-article',
      },
    },
    {
      id: 'process-article',
      type: 'custom',
      config: {
        steps: [
          {
            id: 'navigate-article',
            type: 'navigate',
            config: { url: '$loopItem' },
          },
          {
            id: 'extract-content',
            type: 'extract',
            config: { selector: '.article-body', extractType: 'text' },
          },
          {
            id: 'summarize',
            type: 'analyze',
            config: {
              data: '$step_extract-content',
              analysisType: 'summarize',
            },
          },
        ],
      },
    },
  ],
};

export const formFillingWorkflow: Workflow = {
  id: 'form-filling',
  name: 'Automated Form Filling',
  description: 'Fill out forms with provided data',
  initialStep: 'fill-name',
  steps: [
    {
      id: 'fill-name',
      type: 'action',
      config: {
        action: 'type',
        params: {
          selector: 'input[name="name"]',
          value: '$name',
        },
      },
      nextSteps: ['fill-email'],
    },
    {
      id: 'fill-email',
      type: 'action',
      config: {
        action: 'type',
        params: {
          selector: 'input[name="email"]',
          value: '$email',
        },
      },
      nextSteps: ['fill-message'],
    },
    {
      id: 'fill-message',
      type: 'action',
      config: {
        action: 'type',
        params: {
          selector: 'textarea[name="message"]',
          value: '$message',
        },
      },
      nextSteps: ['validate'],
    },
    {
      id: 'validate',
      type: 'custom',
      config: {
        handler: async (context: Record<string, any>) => {
          // Validation logic
          const required = ['name', 'email', 'message'];
          const missing = required.filter((field) => !context[field]);
          return {
            isValid: missing.length === 0,
            missing,
          };
        },
      },
    },
  ],
};

export const dataExtractionWorkflow: Workflow = {
  id: 'data-extraction',
  name: 'Data Extraction',
  description: 'Extract structured data from a table or list',
  initialStep: 'extract-rows',
  steps: [
    {
      id: 'extract-rows',
      type: 'extract',
      config: {
        selector: 'table tbody tr',
        extractType: 'elements',
      },
      nextSteps: ['loop-rows'],
    },
    {
      id: 'loop-rows',
      type: 'loop',
      config: {
        items: '$step_extract-rows',
        subStep: 'extract-cells',
      },
    },
    {
      id: 'extract-cells',
      type: 'extract',
      config: {
        selector: 'td',
        extractType: 'text',
        context: '$loopItem',
      },
      nextSteps: ['format-data'],
    },
    {
      id: 'format-data',
      type: 'analyze',
      config: {
        data: '$step_loop-rows',
        analysisType: 'format-table',
      },
    },
  ],
};

export const monitoringWorkflow: Workflow = {
  id: 'price-monitoring',
  name: 'Price Monitoring',
  description: 'Monitor a product price and alert on changes',
  initialStep: 'extract-price',
  steps: [
    {
      id: 'extract-price',
      type: 'extract',
      config: {
        selector: '.price',
        extractType: 'text',
      },
      nextSteps: ['check-threshold'],
    },
    {
      id: 'check-threshold',
      type: 'condition',
      config: {
        condition: {
          left: '$step_extract-price',
          operator: '<',
          right: '$threshold',
        },
      },
      onSuccess: 'alert',
      onError: 'end',
    },
    {
      id: 'alert',
      type: 'custom',
      config: {
        handler: async (context: Record<string, any>) => {
          // Send notification
          return {
            notified: true,
            price: context.step_extractPrice,
            threshold: context.threshold,
          };
        },
      },
    },
    {
      id: 'end',
      type: 'custom',
      config: {
        handler: async () => ({ message: 'No price drop detected' }),
      },
    },
  ],
};

export const paginationWorkflow: Workflow = {
  id: 'pagination-scraping',
  name: 'Pagination Scraping',
  description: 'Scrape data from paginated results',
  initialStep: 'extract-current',
  steps: [
    {
      id: 'extract-current',
      type: 'extract',
      config: {
        selector: '.result-item',
        extractType: 'elements',
      },
      nextSteps: ['check-next'],
    },
    {
      id: 'check-next',
      type: 'condition',
      config: {
        condition: {
          left: '$hasNextPage',
          operator: '===',
          right: true,
        },
      },
      onSuccess: 'click-next',
      onError: 'compile-results',
    },
    {
      id: 'click-next',
      type: 'action',
      config: {
        action: 'click',
        params: {
          selector: '.next-button',
        },
      },
      nextSteps: ['extract-current'],
    },
    {
      id: 'compile-results',
      type: 'analyze',
      config: {
        data: '$allResults',
        analysisType: 'compile',
      },
    },
  ],
};

/**
 * Export all templates
 */
export const workflowTemplates: Workflow[] = [
  priceComparisonWorkflow,
  contentAggregationWorkflow,
  formFillingWorkflow,
  dataExtractionWorkflow,
  monitoringWorkflow,
  paginationWorkflow,
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): Workflow | undefined {
  return workflowTemplates.find((template) => template.id === id);
}

/**
 * Get all template names and descriptions
 */
export function getTemplateSummaries(): Array<{ id: string; name: string; description: string }> {
  return workflowTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
  }));
}
