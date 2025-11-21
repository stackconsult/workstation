# Workflow Templates Documentation

## Overview

Workflow Templates are pre-built, production-ready workflows that you can use as starting points for your automation tasks. Each template is carefully designed to solve common use cases and can be customized to fit your specific needs.

## Available Templates

### 1. Web Scraping Workflow 🌐
**Category:** Scraping  
**Complexity:** Beginner  
**Estimated Duration:** 2-5 minutes

**Description:**  
Navigate to a website, extract data from the page, and save it to a file. Perfect for extracting product information, article content, or any structured data from web pages.

**Use Cases:**
- Product catalog scraping
- News article extraction
- Content aggregation
- Data mining

**Nodes:**
1. Start
2. Navigate to Website
3. Extract Data
4. Save to File
5. End

---

### 2. Form Automation Workflow 📝
**Category:** Automation  
**Complexity:** Beginner  
**Estimated Duration:** 1-3 minutes

**Description:**  
Navigate to a website, fill out a form with data, submit it, and wait for confirmation. Ideal for automating repetitive form submissions, data entry, or registration processes.

**Use Cases:**
- Automated form submissions
- Bulk data entry
- Registration automation
- Survey responses

**Nodes:**
1. Start
2. Navigate to Form
3. Fill Form Fields
4. Submit Form
5. Wait for Confirmation
6. End

---

### 3. Data Processing Pipeline ⚙️
**Category:** Data Processing  
**Complexity:** Intermediate  
**Estimated Duration:** 3-10 minutes

**Description:**  
Read data from a CSV file, process and transform it, then write the results to a new file. Great for data cleaning, ETL operations, or batch processing tasks.

**Use Cases:**
- Data cleaning
- ETL pipelines
- Batch transformations
- Data migration

**Nodes:**
1. Start
2. Read Input CSV
3. Parse CSV Data
4. Transform Data
5. Write Output CSV
6. End

---

### 4. API Integration Workflow 🔌
**Category:** Integration  
**Complexity:** Intermediate  
**Estimated Duration:** 2-5 minutes

**Description:**  
Fetch data from an external API, transform the response, and store it in your database. Perfect for integrating third-party services or syncing external data.

**Use Cases:**
- Third-party API integration
- Data synchronization
- External service consumption
- API data aggregation

**Nodes:**
1. Start
2. Fetch API Data
3. Parse Response
4. Transform Data
5. Store in Database
6. End

---

### 5. Website Monitoring Workflow 📊
**Category:** Monitoring  
**Complexity:** Intermediate  
**Estimated Duration:** 2-4 minutes

**Description:**  
Navigate to a website, take a screenshot, check for specific content changes, and send notifications. Ideal for monitoring website uptime, content updates, or price changes.

**Use Cases:**
- Uptime monitoring
- Content change detection
- Price tracking
- Website health checks

**Nodes:**
1. Start
2. Navigate to Website
3. Extract Content
4. Check for Changes
5. Send Alert Email (if changed)
6. Save Screenshot
7. End

---

### 6. E-Commerce Price Comparison 🛒
**Category:** E-Commerce  
**Complexity:** Advanced  
**Estimated Duration:** 5-15 minutes

**Description:**  
Search for products across multiple e-commerce sites, extract prices and details, compare them, and save the results to CSV. Perfect for price monitoring and competitive analysis.

**Use Cases:**
- Competitor price monitoring
- Multi-site price comparison
- Market research
- Price tracking databases

**Nodes:**
1. Start
2. Search Site 1 (parallel)
3. Search Site 2 (parallel)
4. Extract Prices Site 1
5. Extract Prices Site 2
6. Merge Results
7. Compare & Sort
8. Save to CSV
9. End

---

### 7. Social Media Automation 📱
**Category:** Social Media  
**Complexity:** Advanced  
**Estimated Duration:** 3-7 minutes

**Description:**  
Log into a social media platform, create and publish a post, and then log out. Useful for scheduled posting, content distribution, or social media management.

**Use Cases:**
- Scheduled social media posts
- Content distribution
- Automated announcements
- Social media campaigns

**Nodes:**
1. Start
2. Go to Login Page
3. Enter Credentials
4. Click Login
5. Wait for Dashboard
6. Click New Post
7. Write Post Content
8. Publish Post
9. Wait for Confirmation
10. Logout
11. End

---

### 8. Automated Report Generation 📈
**Category:** Reporting  
**Complexity:** Advanced  
**Estimated Duration:** 10-20 minutes

**Description:**  
Gather data from multiple sources (database, API, files), process and analyze it, generate a PDF report, and send it via email. Perfect for automated reporting, analytics, and business intelligence.

**Use Cases:**
- Business intelligence reports
- Automated analytics
- Performance dashboards
- Executive summaries

**Nodes:**
1. Start
2. Query Sales Data (parallel)
3. Fetch API Metrics (parallel)
4. Read Config (parallel)
5. Merge Data Sources
6. Calculate Metrics
7. Create Excel Summary
8. Generate PDF Report
9. Collect Outputs
10. Send Report Email
11. End

---

## Using Templates

### From the Web UI

1. Open the Workflow Builder at `http://localhost:3000/workflow-builder.html`
2. Click on the **"📚 Templates"** tab
3. Browse or search for templates
4. Click **"Use Template"** on your chosen template
5. The template will load into the builder
6. Customize parameters as needed
7. Save and execute your workflow

### From the Chrome Extension

1. Open the extension popup
2. Navigate to the **"Templates"** tab
3. Click on a template card
4. The workflow builder will open with the template loaded
5. Customize and execute

### Via API

```javascript
// List all templates
fetch('http://localhost:3000/api/workflow-templates')
  .then(res => res.json())
  .then(data => console.log(data.data.templates));

// Get specific template
fetch('http://localhost:3000/api/workflow-templates/web-scraping-basic')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Clone a template
fetch('http://localhost:3000/api/workflow-templates/web-scraping-basic/clone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Custom Scraper',
    customParams: {
      'node-2': { url: 'https://mysite.com' }
    }
  })
})
  .then(res => res.json())
  .then(data => console.log(data.data));
```

## Customizing Templates

After loading a template, you can customize it by:

1. **Editing Node Parameters**: Click on any node to edit its parameters
2. **Adding New Nodes**: Drag new nodes from the Node Library
3. **Removing Nodes**: Click the × button on nodes you don't need
4. **Rearranging Nodes**: Drag nodes to reposition them
5. **Modifying Connections**: Delete and recreate connections as needed

## Template Categories

| Category | Description | Template Count |
|----------|-------------|----------------|
| 🌐 Web Scraping | Extract data from websites | 1 |
| 📝 Form Automation | Automate form filling and submissions | 1 |
| ⚙️ Data Processing | Transform and process data | 1 |
| 🔌 API Integration | Connect with external APIs | 1 |
| 📊 Monitoring | Monitor websites and services | 1 |
| 🛒 E-Commerce | Price tracking and product monitoring | 1 |
| 📱 Social Media | Automate social media tasks | 1 |
| 📈 Reporting | Generate automated reports | 1 |

## Best Practices

### 1. Start with a Template
Always start with the closest matching template rather than building from scratch. This saves time and follows proven patterns.

### 2. Test in Development
Before running templates in production:
- Use test URLs and accounts
- Verify all selectors are correct
- Check error handling
- Test with small data sets

### 3. Customize Gradually
Make incremental changes to templates:
- Change one parameter at a time
- Test after each change
- Save versions as you go

### 4. Use Descriptive Names
When saving customized templates:
- Use clear, descriptive names
- Include the date if versioning
- Note the purpose in description

### 5. Handle Errors
Enhance templates with error handling:
- Add retry logic for network requests
- Include timeout parameters
- Add fallback selectors
- Log errors for debugging

## Creating Your Own Templates

Advanced users can create their own templates by:

1. **Building a Workflow**: Create and test your workflow in the builder
2. **Exporting**: Use the "Export" button to download as JSON
3. **Adding Metadata**: Add template metadata (description, category, etc.)
4. **Sharing**: Place in `/src/workflow-templates/` directory
5. **Registering**: Add to index.ts to make it available

Example template structure:
```json
{
  "id": "my-custom-template",
  "name": "My Custom Template",
  "description": "What this template does",
  "category": "automation",
  "icon": "🤖",
  "tags": ["tag1", "tag2"],
  "complexity": "intermediate",
  "estimatedDuration": "5-10 minutes",
  "nodes": [...],
  "connections": [...]
}
```

## Troubleshooting

### Template Won't Load
- Check that backend is running on port 3000
- Verify network connectivity
- Check browser console for errors

### Missing Parameters
- Some templates use placeholder values
- Update URLs, selectors, and credentials
- Test individual nodes before full execution

### Execution Fails
- Verify all parameters are filled
- Check selectors are still valid
- Ensure target websites are accessible
- Review execution logs for errors

## API Reference

### GET /api/workflow-templates
List all available templates with optional filtering.

**Query Parameters:**
- `category`: Filter by category
- `complexity`: Filter by complexity level
- `search`: Search by name, description, or tags

### GET /api/workflow-templates/:id
Get a specific template by ID.

### POST /api/workflow-templates/:id/clone
Clone a template to create a new workflow.

**Request Body:**
- `name`: Custom name for the workflow
- `customParams`: Object mapping node IDs to custom parameters

## Support

For questions or issues:
- GitHub Issues: Report bugs or request features
- Documentation: Check README.md and API.md
- Examples: Review template JSON files in `/src/workflow-templates/`

## Contributing

To contribute new templates:
1. Create and test your workflow
2. Export as JSON
3. Add appropriate metadata
4. Submit a pull request
5. Include documentation and test results

---

**Last Updated:** 2025-11-21  
**Version:** 1.0.0
