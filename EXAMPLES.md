# Examples

This guide provides practical examples of using the Unified Browser Agent for common tasks.

## Table of Contents

- [Web Scraping](#web-scraping)
- [Form Automation](#form-automation)
- [Data Analysis](#data-analysis)
- [Content Summarization](#content-summarization)
- [Navigation and Testing](#navigation-and-testing)
- [Research Workflows](#research-workflows)

## Web Scraping

### Example 1: Extract Product Information

**Scenario**: You're on an e-commerce product listing page and want to extract all products.

**Command**:
```
Extract all products from this page including name, price, and rating
```

**Expected Output**:
```json
[
  {
    "name": "Product A",
    "price": "$29.99",
    "rating": "4.5 stars"
  },
  {
    "name": "Product B",
    "price": "$39.99",
    "rating": "4.8 stars"
  }
]
```

### Example 2: Scrape Contact Information

**Scenario**: Extract contact details from a company website.

**Command**:
```
Find and extract all email addresses and phone numbers from this page
```

**Expected Output**:
```
Emails: contact@company.com, support@company.com
Phone: +1-555-0123, +1-555-0124
```

### Example 3: Extract Article Metadata

**Scenario**: Get article information from a blog post.

**Command**:
```
Extract the article title, author, publication date, and all section headings
```

## Form Automation

### Example 4: Fill a Contact Form

**Scenario**: Automatically fill out a contact form with test data.

**Command**:
```
Fill the contact form with:
- Name: John Doe
- Email: john.doe@example.com
- Message: This is a test message
```

**What happens**:
1. Navigator finds form fields
2. Executor fills each field
3. Validator checks all required fields are filled

### Example 5: Sign Up Flow

**Scenario**: Complete a multi-step sign-up form.

**Command**:
```
Complete the sign-up form:
Step 1: Username: testuser123, Email: test@example.com
Step 2: First Name: Test, Last Name: User
Step 3: Check the terms and conditions checkbox
```

### Example 6: Search and Filter

**Scenario**: Use a website's search functionality.

**Command**:
```
1. Enter "laptop" in the search box
2. Click the search button
3. Apply filter: Price range $500-$1000
4. Sort by: Customer rating
```

## Data Analysis

### Example 7: Sentiment Analysis of Reviews

**Scenario**: Analyze customer reviews on a product page.

**Command**:
```
Read all customer reviews on this page and analyze the overall sentiment. Categorize as positive, neutral, or negative and provide a summary.
```

**Expected Output**:
```
Overall Sentiment: Positive (72%)

Summary:
- 15 Positive reviews: Customers praise quality and value
- 6 Neutral reviews: Mixed feedback on shipping times
- 3 Negative reviews: Some issues with packaging

Common themes:
✓ Excellent quality
✓ Good value for money
✗ Slow shipping
✗ Packaging issues
```

### Example 8: Compare Pricing

**Scenario**: Compare product prices across multiple listings.

**Command**:
```
On this comparison page, extract prices for the same product from different sellers and tell me which has the best deal
```

### Example 9: Analyze Table Data

**Scenario**: Extract and analyze data from an HTML table.

**Command**:
```
Extract data from the pricing table and calculate:
1. Average price
2. Cheapest option
3. Most expensive option
4. Recommended option based on features
```

## Content Summarization

### Example 10: Summarize Long Article

**Scenario**: Get the key points from a lengthy article.

**Command**:
```
Summarize this article in 3 bullet points focusing on the main arguments
```

### Example 11: Extract Key Statistics

**Scenario**: Pull important numbers from a report.

**Command**:
```
Extract all numerical statistics and percentages from this article, organize them by category
```

### Example 12: Create Outline

**Scenario**: Generate an outline of a documentation page.

**Command**:
```
Create a hierarchical outline of this documentation page showing all sections and subsections
```

**Expected Output**:
```
1. Introduction
   1.1 Getting Started
   1.2 Prerequisites
2. Installation
   2.1 Windows
   2.2 macOS
   2.3 Linux
3. Configuration
   ...
```

## Navigation and Testing

### Example 13: Find and Click Button

**Scenario**: Locate and interact with a specific button.

**Command**:
```
Find the "Download PDF" button and click it
```

### Example 14: Navigate Through Pagination

**Scenario**: Go through paginated results.

**Command**:
```
1. Extract data from current page
2. Click "Next" button
3. Repeat until reaching last page
```

### Example 15: Test Form Validation

**Scenario**: Test if form validation is working.

**Command**:
```
Try to submit the contact form without filling any fields and report what error messages appear
```

## Research Workflows

### Example 16: Competitive Analysis

**Scenario**: Research competitor features.

**Command**:
```
Analyze this SaaS product page and extract:
1. All listed features
2. Pricing tiers
3. Key differentiators mentioned
4. Target audience
```

### Example 17: Job Listing Analysis

**Scenario**: Extract job requirements from a listing.

**Command**:
```
From this job posting, extract:
- Required qualifications
- Preferred qualifications  
- Key responsibilities
- Salary range if mentioned
- Location and remote options
```

### Example 18: Academic Research

**Scenario**: Extract information from research papers.

**Command**:
```
From this paper abstract, identify:
- Research question
- Methodology
- Key findings
- Conclusions
```

## Real-World Workflows

### Workflow 1: Price Monitoring

**Objective**: Monitor product prices daily.

**Commands**:
1. Navigate to product page
2. Extract current price
3. Compare with previous price
4. Alert if price dropped below threshold

**Implementation**:
```
Step 1: Go to [product URL]
Step 2: Extract the price element
Step 3: [Store price for comparison]
Step 4: If price < $target, notify me
```

### Workflow 2: Content Aggregation

**Objective**: Collect articles on a specific topic.

**Commands**:
1. Search for topic keyword
2. Extract all article titles and links
3. Visit each article
4. Extract summary and metadata
5. Compile into structured format

**Implementation**:
```
Step 1: Search for "AI automation" on this news site
Step 2: Get top 10 article links
Step 3: For each article:
  - Extract headline
  - Extract publication date
  - Extract author
  - Summarize in 2 sentences
Step 4: Return as JSON
```

### Workflow 3: Lead Generation

**Objective**: Extract business contacts from directory.

**Commands**:
1. Navigate directory pages
2. Extract company information
3. Find contact details
4. Verify email format
5. Export as CSV format

**Implementation**:
```
Step 1: On this business directory page
Step 2: Extract for each listing:
  - Company name
  - Contact email
  - Phone number
  - Website
Step 3: Validate email formats
Step 4: Return in CSV format
```

### Workflow 4: Social Media Analysis

**Objective**: Analyze engagement on social posts.

**Commands**:
1. Extract post content
2. Count likes, shares, comments
3. Analyze comment sentiment
4. Identify trending topics
5. Generate report

**Implementation**:
```
Step 1: Extract the post text
Step 2: Count engagement metrics:
  - Likes: [number]
  - Shares: [number]
  - Comments: [number]
Step 3: Analyze comment sentiment
Step 4: List top 5 mentioned keywords
Step 5: Generate summary report
```

## Tips for Each Use Case

### For Web Scraping
- Be specific about which elements to extract
- Use visual descriptors ("the price in red text")
- Handle pagination explicitly
- Consider rate limiting for multiple pages

### For Form Automation
- Always validate before submission
- Use test data for forms requiring sensitive info
- Check for CAPTCHAs or anti-bot measures
- Save successful workflows for reuse

### For Data Analysis
- Provide clear analysis criteria
- Ask for structured output (JSON, tables)
- Request confidence levels for subjective analysis
- Combine multiple data points for insights

### For Content Summarization
- Specify desired length
- Indicate focus areas
- Request different summary styles (bullet points, paragraphs)
- Ask for key quotes if needed

### For Navigation
- Use visual landmarks ("the button in the top right")
- Wait for elements to load
- Handle popups and overlays
- Test on different screen sizes

### For Research
- Be systematic in data collection
- Use consistent formatting for comparisons
- Validate extracted information
- Cross-reference multiple sources

## Common Patterns

### Pattern: Extraction + Validation
```
1. Extract all email addresses
2. Validate each email format
3. Return only valid emails
```

### Pattern: Navigate + Extract + Repeat
```
For each page in pagination:
  1. Extract data
  2. Click next button
  3. Wait for page load
```

### Pattern: Extract + Analyze + Decide
```
1. Extract product features
2. Analyze against requirements
3. Recommend best option
```

### Pattern: Monitor + Compare + Alert
```
1. Extract current value
2. Compare with threshold
3. Alert if condition met
```

## Testing Your Commands

Before running complex workflows:

1. **Test each step individually**
   ```
   First: "Extract the product name"
   Then: "Extract the price"
   Finally: "Combine both"
   ```

2. **Start with small datasets**
   ```
   "Extract data from the first 3 items"
   before
   "Extract data from all items"
   ```

3. **Use specific selectors**
   ```
   "Find the price in the element with class 'product-price'"
   ```

4. **Add validation steps**
   ```
   "Extract the price and verify it's in USD format"
   ```

## Next Steps

- Practice with these examples on different websites
- Create your own workflows for common tasks
- Save successful commands for reuse
- Explore the [API Documentation](API.md) for advanced usage
