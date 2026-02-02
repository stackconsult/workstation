/**
 * Training Lessons Content
 * Detailed lesson content for the training module
 * Phase 11: Training Component
 */

import { Lesson, trainingModule } from "./index";

/**
 * Register all default training lessons
 */
export function registerAllLessons(): void {
  // Lesson 1: Email Automation Basics
  registerEmailBasicsLesson();

  // Lesson 2: File Management
  registerFileBasicsLesson();

  // Lesson 3: RSS Intelligence
  registerRssBasicsLesson();

  // Lesson 4: Templates
  registerTemplateBasicsLesson();

  // Lesson 5: Advanced Workflows
  registerAdvancedWorkflowLesson();
}

function registerEmailBasicsLesson(): void {
  const lesson: Lesson = {
    id: "email-basics",
    title: "Email Automation Basics",
    description:
      "Learn how to automate email communication using the Email Agent",
    category: "email",
    difficulty: "beginner",
    estimatedTime: 15,
    prerequisites: [],
    objectives: [
      "Understand Email Agent capabilities",
      "Send automated emails",
      "Read and process incoming emails",
      "Create email filters",
    ],
    content: {
      sections: [
        {
          title: "Introduction to Email Agent",
          content:
            "The Email Agent allows you to automate email communication across Gmail, Outlook, and custom IMAP/SMTP providers. This powerful tool enables you to streamline client communication, automate follow-ups, and process incoming emails programmatically.",
          tips: [
            "Always use environment variables for email credentials",
            "Test with a dedicated test email account before production use",
            "Consider rate limits when sending bulk emails",
            "Use meaningful subject lines for better deliverability",
          ],
        },
        {
          title: "Sending Your First Email",
          content:
            "Let's start by sending a simple email using the Email Agent. This is the foundation of email automation.",
          codeExamples: [
            {
              title: "Basic Email Example",
              code: `const emailAgent = new EmailAgent({
  provider: 'gmail',
  email: 'your-email@gmail.com'
});

// Connect to email service
await emailAgent.connect();

// Send email
await emailAgent.sendEmail({
  to: 'client@example.com',
  subject: 'Welcome to Our Service',
  body: 'Thank you for choosing us! We\\'re excited to work with you.'
});

// Always disconnect when done
await emailAgent.disconnect();`,
              language: "typescript",
              explanation:
                "This example demonstrates the basic flow: create agent, connect, send email, disconnect. The disconnect step is important to free up resources.",
            },
            {
              title: "Email with HTML Body",
              code: `await emailAgent.sendEmail({
  to: 'client@example.com',
  subject: 'Welcome!',
  body: 'Plain text version',
  html: '<h1>Welcome!</h1><p>HTML version</p>'
});`,
              language: "typescript",
              explanation:
                "You can provide both plain text and HTML versions of your email for better compatibility.",
            },
          ],
        },
        {
          title: "Reading Unread Emails",
          content:
            "Fetch and process unread emails to automate responses or data extraction.",
          codeExamples: [
            {
              title: "Fetch Unread Emails",
              code: `const emails = await emailAgent.getUnreadEmails({
  limit: 10,
  folder: 'Inbox'
});

// Process each email
for (const email of emails) {
  console.log(\`From: \${email.from}\`);
  console.log(\`Subject: \${email.subject}\`);
  console.log(\`Body: \${email.body}\`);
  
  // Mark as read after processing
  await emailAgent.markAsRead([email.id]);
}`,
              language: "typescript",
              explanation:
                "Fetch unread emails and process them systematically. Always mark emails as read after processing to avoid duplicates.",
            },
          ],
        },
      ],
    },
    exercises: [
      {
        id: "email-ex-1",
        title: "Send Welcome Email",
        description: "Practice sending a welcome email to a new client",
        task: 'Write code to send an email with subject "Welcome!" and body "Thanks for joining us!"',
        hints: [
          "Use the sendEmail() method",
          "Remember to include to, subject, and body parameters",
          "Don't forget to connect before sending",
        ],
        solution: {
          code: `await emailAgent.connect();
await emailAgent.sendEmail({
  to: 'newclient@example.com',
  subject: 'Welcome!',
  body: 'Thanks for joining us!'
});
await emailAgent.disconnect();`,
          explanation:
            "Always connect first, perform the operation, then disconnect to free resources.",
        },
        validation: (userCode: string) => {
          const hasConnect = userCode.includes("connect");
          const hasSendEmail = userCode.includes("sendEmail");
          const hasWelcome = userCode.includes("Welcome");
          const hasJoining = userCode.includes("joining");

          if (hasConnect && hasSendEmail && hasWelcome && hasJoining) {
            return {
              passed: true,
              feedback:
                "Excellent! You successfully sent a welcome email with proper connection handling.",
            };
          }

          const errors = [];
          if (!hasConnect) errors.push("Missing connect() call");
          if (!hasSendEmail) errors.push("Missing sendEmail() call");
          if (!hasWelcome || !hasJoining)
            errors.push("Missing required email content");

          return {
            passed: false,
            feedback:
              "Your solution is incomplete. Check the hints and try again.",
            errors,
          };
        },
      },
    ],
    resources: [
      {
        type: "documentation",
        title: "Email Agent API Reference",
        url: "/docs/api/email-agent",
      },
      {
        type: "example",
        title: "Email Automation Examples",
        url: "/examples/email-automation",
      },
      {
        type: "video",
        title: "Getting Started with Email Automation",
        url: "/videos/email-automation-intro",
        duration: 12,
      },
    ],
  };

  trainingModule.registerLesson(lesson);
}

function registerFileBasicsLesson(): void {
  const lesson: Lesson = {
    id: "file-basics",
    title: "File Management Basics",
    description: "Learn how to automate file operations with the File Agent",
    category: "file",
    difficulty: "beginner",
    estimatedTime: 20,
    prerequisites: [],
    objectives: [
      "Understand File Agent capabilities",
      "Create and manage directories",
      "Read and write files",
      "Search for files efficiently",
    ],
    content: {
      sections: [
        {
          title: "Introduction to File Agent",
          content:
            "The File Agent provides a unified interface for file operations across local and cloud storage systems. It handles path management, directory creation, and file operations with built-in error handling.",
          tips: [
            "Use absolute paths when possible for clarity",
            "Parent directories are created automatically",
            "Choose appropriate encoding for text vs binary files",
            "Always handle file operation errors",
          ],
        },
        {
          title: "Creating Directory Structures",
          content:
            "Organize your workspace by creating directory structures programmatically.",
          codeExamples: [
            {
              title: "Create Client Directory",
              code: `const fileAgent = new FileAgent({
  storageType: 'local',
  basePath: '/workspace'
});

// Creates /workspace/clients/acme-corp
await fileAgent.createDirectory({
  path: 'clients/acme-corp'
});

// Parent directories created automatically
await fileAgent.createDirectory({
  path: 'clients/acme-corp/projects/project-alpha'
});`,
              language: "typescript",
              explanation:
                "The createDirectory method creates all parent directories automatically (recursive: true by default).",
            },
          ],
        },
        {
          title: "Reading and Writing Files",
          content: "Store and retrieve data using file operations.",
          codeExamples: [
            {
              title: "Write and Read Files",
              code: `// Write a file
await fileAgent.writeFile({
  path: 'clients/acme-corp/notes.txt',
  content: 'Meeting notes from 2025-01-15',
  encoding: 'utf-8'
});

// Read the file back
const content = await fileAgent.readFile({
  path: 'clients/acme-corp/notes.txt',
  encoding: 'utf-8'
});

console.log(content); // "Meeting notes from 2025-01-15"`,
              language: "typescript",
              explanation:
                "Files are written with automatic directory creation. Specify encoding for text files.",
            },
          ],
        },
      ],
    },
    exercises: [
      {
        id: "file-ex-1",
        title: "Create Project Structure",
        description: "Create a complete project directory with a README file",
        task: 'Create directory "projects/my-project" and write a README.md file in it',
        hints: [
          "Use createDirectory() for the folder",
          "Use writeFile() for the README",
          "README should include a project title",
        ],
        solution: {
          code: `await fileAgent.createDirectory({ 
  path: 'projects/my-project' 
});

await fileAgent.writeFile({
  path: 'projects/my-project/README.md',
  content: '# My Project\\n\\nProject description goes here.',
  encoding: 'utf-8'
});`,
          explanation:
            "Creates the project structure and adds a markdown README with proper formatting.",
        },
        validation: (userCode: string) => {
          const hasCreateDir = userCode.includes("createDirectory");
          const hasWriteFile = userCode.includes("writeFile");
          const hasReadme = userCode.includes("README");

          if (hasCreateDir && hasWriteFile && hasReadme) {
            return {
              passed: true,
              feedback:
                "Perfect! You created the project structure with a README file.",
            };
          }

          return {
            passed: false,
            feedback:
              "Make sure to create the directory and write the README file.",
            errors: ["Missing required file operations"],
          };
        },
      },
    ],
    resources: [
      {
        type: "documentation",
        title: "File Agent API Reference",
        url: "/docs/api/file-agent",
      },
      {
        type: "article",
        title: "File Management Best Practices",
        url: "/articles/file-management",
      },
    ],
  };

  trainingModule.registerLesson(lesson);
}

function registerRssBasicsLesson(): void {
  const lesson: Lesson = {
    id: "rss-basics",
    title: "RSS Intelligence Gathering",
    description: "Learn how to gather client intelligence from RSS feeds",
    category: "rss",
    difficulty: "intermediate",
    estimatedTime: 25,
    prerequisites: ["email-basics", "file-basics"],
    objectives: [
      "Understand RSS Agent capabilities",
      "Fetch and parse RSS feeds",
      "Extract client mentions automatically",
      "Build comprehensive intelligence repositories",
    ],
    content: {
      sections: [
        {
          title: "Introduction to RSS Intelligence",
          content:
            "The RSS Agent monitors industry news feeds and extracts client-relevant information automatically. It uses relevance scoring to prioritize the most important mentions.",
          tips: [
            "Choose industry-relevant RSS feeds",
            "Use specific client names for better matching",
            "Review relevance scores to tune queries",
            "Monitor multiple sources for comprehensive coverage",
          ],
        },
        {
          title: "Building Intelligence Repositories",
          content:
            "Aggregate intelligence from multiple sources into actionable repositories.",
          codeExamples: [
            {
              title: "Multi-Source Repository",
              code: `const rssAgent = new RssAgent();

const repository = await rssAgent.buildClientRepository({
  rssFeeds: [
    { 
      url: 'https://tech-news.com/rss', 
      sourceName: 'Tech News' 
    },
    { 
      url: 'https://industry-blog.com/rss', 
      sourceName: 'Industry Blog' 
    }
  ],
  clientName: 'Acme Corporation'
});

// Results are sorted by relevance
console.log(\`Found \${repository.items.length} relevant mentions\`);
repository.items.forEach(item => {
  console.log(\`[\${item.relevanceScore.toFixed(2)}] \${item.title}\`);
});`,
              language: "typescript",
              explanation:
                "Builds a comprehensive repository from multiple RSS sources, with items ranked by relevance.",
            },
          ],
        },
      ],
    },
    exercises: [
      {
        id: "rss-ex-1",
        title: "Monitor Client Mentions",
        description: "Build an intelligence repository for a specific client",
        task: 'Monitor mentions of "TechCorp" from an industry RSS feed',
        hints: [
          "Use buildClientRepository()",
          "Provide RSS feed URL and client name",
          "Check relevance scores in results",
        ],
        solution: {
          code: `const repository = await rssAgent.buildClientRepository({
  rssFeeds: [{ 
    url: 'https://industry-feed.com/rss', 
    sourceName: 'Industry Feed' 
  }],
  clientName: 'TechCorp'
});`,
          explanation:
            "Monitors the feed for TechCorp mentions and builds a prioritized repository.",
        },
        validation: (userCode: string) => {
          if (
            userCode.includes("buildClientRepository") &&
            userCode.includes("TechCorp")
          ) {
            return {
              passed: true,
              feedback:
                "Excellent! You successfully monitored client mentions from RSS feeds.",
            };
          }
          return {
            passed: false,
            feedback: "Use buildClientRepository with the correct client name.",
            errors: ["Missing repository building code"],
          };
        },
      },
    ],
    resources: [
      {
        type: "documentation",
        title: "RSS Agent API Reference",
        url: "/docs/api/rss-agent",
      },
      {
        type: "article",
        title: "Intelligence Gathering Strategies",
        url: "/articles/intelligence-gathering",
      },
      {
        type: "video",
        title: "RSS Intelligence Demo",
        url: "/videos/rss-intelligence",
        duration: 18,
      },
    ],
  };

  trainingModule.registerLesson(lesson);
}

function registerTemplateBasicsLesson(): void {
  const lesson: Lesson = {
    id: "template-basics",
    title: "Using Automation Templates",
    description: "Learn how to use pre-built templates for common workflows",
    category: "template",
    difficulty: "beginner",
    estimatedTime: 15,
    prerequisites: [],
    objectives: [
      "Understand the template system",
      "Browse available templates",
      "Apply variables to templates",
      "Execute template-based workflows",
    ],
    content: {
      sections: [
        {
          title: "Introduction to Templates",
          content:
            "Templates provide pre-built workflows for common automation tasks, saving time and ensuring consistency.",
          tips: [
            "Review template requirements before use",
            "Validate all required variables",
            "Test with sample data first",
            "Customize templates when needed",
          ],
        },
        {
          title: "Using Templates",
          content: "Apply templates to create ready-to-execute workflows.",
          codeExamples: [
            {
              title: "Apply Onboarding Template",
              code: `import { templateRegistry } from './templates';

const template = templateRegistry.getTemplate('client-onboarding');

const workflow = templateRegistry.applyVariables(
  template.definition,
  {
    clientName: 'Acme Corp',
    contactEmail: 'john@acme.com',
    startDate: '2025-01-15'
  }
);

// Workflow is now ready to execute`,
              language: "typescript",
              explanation:
                "Retrieves a template and applies client-specific variables to create an executable workflow.",
            },
          ],
        },
      ],
    },
    exercises: [
      {
        id: "template-ex-1",
        title: "Use Client Onboarding Template",
        description: "Apply the onboarding template for a new client",
        task: 'Get and apply the "client-onboarding" template with client details',
        hints: [
          "Use getTemplate() to retrieve",
          "Use applyVariables() with client info",
          "Include all required variables",
        ],
        solution: {
          code: `const template = templateRegistry.getTemplate('client-onboarding');
const workflow = templateRegistry.applyVariables(template.definition, {
  clientName: 'New Client Inc',
  contactEmail: 'contact@newclient.com',
  startDate: new Date().toISOString()
});`,
          explanation:
            "Retrieves and applies the onboarding template with current date.",
        },
        validation: (userCode: string) => {
          if (
            userCode.includes("getTemplate") &&
            userCode.includes("applyVariables") &&
            userCode.includes("client-onboarding")
          ) {
            return {
              passed: true,
              feedback: "Great! You successfully used the template system.",
            };
          }
          return {
            passed: false,
            feedback: "Make sure to get the template and apply variables.",
            errors: ["Missing template operations"],
          };
        },
      },
    ],
    resources: [
      {
        type: "documentation",
        title: "Template System Guide",
        url: "/docs/templates",
      },
      {
        type: "example",
        title: "Template Library",
        url: "/examples/templates",
      },
    ],
  };

  trainingModule.registerLesson(lesson);
}

function registerAdvancedWorkflowLesson(): void {
  const lesson: Lesson = {
    id: "workflow-advanced",
    title: "Building Complex Workflows",
    description:
      "Learn to combine multiple agents into powerful automation workflows",
    category: "workflow",
    difficulty: "advanced",
    estimatedTime: 30,
    prerequisites: [
      "email-basics",
      "file-basics",
      "rss-basics",
      "template-basics",
    ],
    objectives: [
      "Combine multiple agents effectively",
      "Handle agent dependencies",
      "Implement comprehensive error handling",
      "Optimize workflow performance",
    ],
    content: {
      sections: [
        {
          title: "Multi-Agent Workflows",
          content:
            "Create powerful automation by combining Email, File, and RSS agents in coordinated workflows.",
          tips: [
            "Plan execution order carefully",
            "Handle errors at each step",
            "Use intermediate storage for data passing",
            "Consider parallel execution when possible",
            "Log progress for debugging",
          ],
        },
        {
          title: "Complete Intelligence Pipeline",
          content:
            "Build an end-to-end workflow that gathers, stores, and reports intelligence.",
          codeExamples: [
            {
              title: "Full Intelligence Pipeline",
              code: `async function runIntelligencePipeline(
  clientName: string,
  rssFeed: string,
  recipientEmail: string
) {
  try {
    // Step 1: Gather intelligence
    console.log('Gathering intelligence...');
    const repository = await rssAgent.buildClientRepository({
      rssFeeds: [{ url: rssFeed, sourceName: 'Industry News' }],
      clientName
    });
    
    // Step 2: Save to file
    console.log(\`Saving \${repository.items.length} items...\`);
    const timestamp = new Date().toISOString().split('T')[0];
    await fileAgent.writeFile({
      path: \`intelligence/\${clientName}/\${timestamp}.json\`,
      content: JSON.stringify(repository, null, 2),
      encoding: 'utf-8'
    });
    
    // Step 3: Email summary
    console.log('Sending summary email...');
    await emailAgent.sendEmail({
      to: recipientEmail,
      subject: \`Intelligence Update: \${clientName}\`,
      body: \`Found \${repository.items.length} relevant items.\\n\\nTop item: \${repository.items[0]?.title || 'None'}\`
    });
    
    console.log('Pipeline completed successfully!');
    return { success: true, itemCount: repository.items.length };
    
  } catch (error) {
    console.error('Pipeline failed:', error);
    throw error;
  }
}`,
              language: "typescript",
              explanation:
                "A complete pipeline with error handling, logging, and proper data flow between agents.",
            },
          ],
        },
      ],
    },
    exercises: [
      {
        id: "workflow-ex-1",
        title: "Build Complete Workflow",
        description: "Create an end-to-end client monitoring workflow",
        task: "Build a workflow that monitors RSS, saves results, and emails a summary",
        hints: [
          "Use try-catch for error handling",
          "Call agents in the correct order",
          "Pass data between steps",
          "Log progress at each step",
        ],
        solution: {
          code: `try {
  const repo = await rssAgent.buildClientRepository({
    rssFeeds: [{ url: feedUrl, sourceName: 'Source' }],
    clientName: clientName
  });
  
  await fileAgent.writeFile({
    path: \`intel/\${clientName}/latest.json\`,
    content: JSON.stringify(repo)
  });
  
  await emailAgent.sendEmail({
    to: emailAddr,
    subject: \`Update: \${clientName}\`,
    body: \`Found \${repo.items.length} items\`
  });
} catch (error) {
  console.error('Workflow failed:', error);
  throw error;
}`,
          explanation:
            "Complete workflow with proper error handling and data flow.",
        },
        validation: (userCode: string) => {
          const hasRss = userCode.includes("buildClientRepository");
          const hasFile = userCode.includes("writeFile");
          const hasEmail = userCode.includes("sendEmail");
          const hasErrorHandling =
            userCode.includes("try") && userCode.includes("catch");

          if (hasRss && hasFile && hasEmail && hasErrorHandling) {
            return {
              passed: true,
              feedback:
                "Outstanding! You built a complete workflow with all components and error handling.",
            };
          }

          return {
            passed: false,
            feedback:
              "Include all three agents (RSS, File, Email) and add error handling.",
            errors: ["Missing workflow components or error handling"],
          };
        },
      },
    ],
    resources: [
      {
        type: "video",
        title: "Advanced Workflow Patterns",
        url: "/videos/advanced-workflows",
        duration: 25,
      },
      {
        type: "documentation",
        title: "Workflow Best Practices",
        url: "/docs/workflow-patterns",
      },
      {
        type: "example",
        title: "Complete Workflow Examples",
        url: "/examples/complete-workflows",
      },
    ],
  };

  trainingModule.registerLesson(lesson);
}
