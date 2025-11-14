"""
Pre-built workflow templates for common automation tasks.
"""

# Price Comparison Workflow
PRICE_COMPARISON_WORKFLOW = {
    'id': 'price-comparison',
    'name': 'Price Comparison',
    'description': 'Compare product prices across multiple websites',
    'initialStep': 'navigate-1',
    'steps': [
        {
            'id': 'navigate-1',
            'type': 'navigate',
            'config': {
                'url': '$site1Url',
            },
            'nextSteps': ['extract-1'],
        },
        {
            'id': 'extract-1',
            'type': 'extract',
            'config': {
                'selector': '$priceSelector',
                'extractType': 'text',
            },
            'nextSteps': ['navigate-2'],
        },
        {
            'id': 'navigate-2',
            'type': 'navigate',
            'config': {
                'url': '$site2Url',
            },
            'nextSteps': ['extract-2'],
        },
        {
            'id': 'extract-2',
            'type': 'extract',
            'config': {
                'selector': '$priceSelector',
                'extractType': 'text',
            },
            'nextSteps': ['analyze'],
        },
        {
            'id': 'analyze',
            'type': 'analyze',
            'config': {
                'data': {
                    'site1': '$step_extract-1',
                    'site2': '$step_extract-2',
                },
                'analysisType': 'price-comparison',
            },
        },
    ],
}

# Content Aggregation Workflow
CONTENT_AGGREGATION_WORKFLOW = {
    'id': 'content-aggregation',
    'name': 'Content Aggregation',
    'description': 'Collect and summarize articles from multiple sources',
    'initialStep': 'extract-links',
    'steps': [
        {
            'id': 'extract-links',
            'type': 'extract',
            'config': {
                'selector': 'a.article-link',
                'extractType': 'href',
            },
            'nextSteps': ['loop-articles'],
        },
        {
            'id': 'loop-articles',
            'type': 'loop',
            'config': {
                'items': '$step_extract-links',
                'maxItems': 10,
            },
            'nextSteps': ['aggregate'],
        },
        {
            'id': 'aggregate',
            'type': 'analyze',
            'config': {
                'data': '$step_loop-articles',
                'analysisType': 'content-aggregation',
            },
        },
    ],
}

# Form Filling Workflow
FORM_FILLING_WORKFLOW = {
    'id': 'form-filling',
    'name': 'Form Filling',
    'description': 'Automatically fill out web forms',
    'initialStep': 'navigate',
    'steps': [
        {
            'id': 'navigate',
            'type': 'navigate',
            'config': {
                'url': '$formUrl',
            },
            'nextSteps': ['fill-name', 'fill-email'],  # Parallel execution
        },
        {
            'id': 'fill-name',
            'type': 'action',
            'config': {
                'actionType': 'type',
                'selector': 'input[name="name"]',
                'value': '$name',
            },
            'nextSteps': ['submit'],
        },
        {
            'id': 'fill-email',
            'type': 'action',
            'config': {
                'actionType': 'type',
                'selector': 'input[name="email"]',
                'value': '$email',
            },
            'nextSteps': ['submit'],
        },
        {
            'id': 'submit',
            'type': 'action',
            'config': {
                'actionType': 'click',
                'selector': 'button[type="submit"]',
            },
        },
    ],
}

# Data Extraction Workflow
DATA_EXTRACTION_WORKFLOW = {
    'id': 'data-extraction',
    'name': 'Data Extraction',
    'description': 'Extract structured data from a webpage',
    'initialStep': 'navigate',
    'steps': [
        {
            'id': 'navigate',
            'type': 'navigate',
            'config': {
                'url': '$targetUrl',
            },
            'nextSteps': ['extract-table'],
        },
        {
            'id': 'extract-table',
            'type': 'extract',
            'config': {
                'selector': 'table tbody tr',
                'extractType': 'structured',
                'fields': {
                    'name': 'td:nth-child(1)',
                    'value': 'td:nth-child(2)',
                    'date': 'td:nth-child(3)',
                },
            },
            'nextSteps': ['analyze'],
        },
        {
            'id': 'analyze',
            'type': 'analyze',
            'config': {
                'data': '$step_extract-table',
                'analysisType': 'data-extraction',
            },
        },
    ],
}

# Price Monitoring Workflow
PRICE_MONITORING_WORKFLOW = {
    'id': 'price-monitoring',
    'name': 'Price Monitoring',
    'description': 'Monitor price changes and alert on threshold',
    'initialStep': 'navigate',
    'steps': [
        {
            'id': 'navigate',
            'type': 'navigate',
            'config': {
                'url': '$productUrl',
            },
            'nextSteps': ['extract-price'],
        },
        {
            'id': 'extract-price',
            'type': 'extract',
            'config': {
                'selector': '$priceSelector',
                'extractType': 'text',
            },
            'nextSteps': ['check-threshold'],
        },
        {
            'id': 'check-threshold',
            'type': 'condition',
            'config': {
                'condition': 'step_extract-price["data"][0] < $targetPrice',
            },
            'onSuccess': 'send-alert',
            'onError': 'end',
        },
        {
            'id': 'send-alert',
            'type': 'custom',
            'config': {
                'handler': 'send-notification',
                'message': 'Price dropped below $targetPrice!',
            },
        },
        {
            'id': 'end',
            'type': 'analyze',
            'config': {
                'data': '$step_extract-price',
                'analysisType': 'price-monitoring',
            },
        },
    ],
}

# Pagination Scraping Workflow
PAGINATION_SCRAPING_WORKFLOW = {
    'id': 'pagination-scraping',
    'name': 'Pagination Scraping',
    'description': 'Scrape data across multiple pages with pagination',
    'initialStep': 'navigate',
    'steps': [
        {
            'id': 'navigate',
            'type': 'navigate',
            'config': {
                'url': '$startUrl',
            },
            'nextSteps': ['extract-page'],
        },
        {
            'id': 'extract-page',
            'type': 'extract',
            'config': {
                'selector': '$itemSelector',
                'extractType': 'structured',
            },
            'nextSteps': ['check-next-page'],
        },
        {
            'id': 'check-next-page',
            'type': 'condition',
            'config': {
                'condition': 'len(step_extract-page["data"]) > 0',
            },
            'onSuccess': 'click-next',
            'onError': 'aggregate',
        },
        {
            'id': 'click-next',
            'type': 'action',
            'config': {
                'actionType': 'click',
                'selector': '$nextPageSelector',
            },
            'nextSteps': ['extract-page'],
            'maxRetries': 5,
        },
        {
            'id': 'aggregate',
            'type': 'analyze',
            'config': {
                'data': '$step_extract-page',
                'analysisType': 'pagination-scraping',
            },
        },
    ],
}

# Multi-Tab Comparison Workflow
MULTI_TAB_COMPARISON_WORKFLOW = {
    'id': 'multi-tab-comparison',
    'name': 'Multi-Tab Comparison',
    'description': 'Compare content across multiple tabs simultaneously',
    'initialStep': 'open-tabs',
    'steps': [
        {
            'id': 'open-tabs',
            'type': 'custom',
            'config': {
                'handler': 'open-multiple-tabs',
                'urls': '$targetUrls',
            },
            'nextSteps': ['extract-tab-1', 'extract-tab-2', 'extract-tab-3'],  # Parallel
        },
        {
            'id': 'extract-tab-1',
            'type': 'extract',
            'config': {
                'tabIndex': 0,
                'selector': '$contentSelector',
                'extractType': 'text',
            },
            'nextSteps': ['compare'],
        },
        {
            'id': 'extract-tab-2',
            'type': 'extract',
            'config': {
                'tabIndex': 1,
                'selector': '$contentSelector',
                'extractType': 'text',
            },
            'nextSteps': ['compare'],
        },
        {
            'id': 'extract-tab-3',
            'type': 'extract',
            'config': {
                'tabIndex': 2,
                'selector': '$contentSelector',
                'extractType': 'text',
            },
            'nextSteps': ['compare'],
        },
        {
            'id': 'compare',
            'type': 'analyze',
            'config': {
                'data': {
                    'tab1': '$step_extract-tab-1',
                    'tab2': '$step_extract-tab-2',
                    'tab3': '$step_extract-tab-3',
                },
                'analysisType': 'multi-tab-comparison',
            },
        },
    ],
}

# All templates
WORKFLOW_TEMPLATES = {
    'price-comparison': PRICE_COMPARISON_WORKFLOW,
    'content-aggregation': CONTENT_AGGREGATION_WORKFLOW,
    'form-filling': FORM_FILLING_WORKFLOW,
    'data-extraction': DATA_EXTRACTION_WORKFLOW,
    'price-monitoring': PRICE_MONITORING_WORKFLOW,
    'pagination-scraping': PAGINATION_SCRAPING_WORKFLOW,
    'multi-tab-comparison': MULTI_TAB_COMPARISON_WORKFLOW,
}
