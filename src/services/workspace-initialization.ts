/**
 * Workspace Initialization Service
 * Production-ready workspace setup with database availability checks
 *
 * Features:
 * - Database availability checking (graceful degradation)
 * - Idempotent initialization (safe to run multiple times)
 * - PostgreSQL database (uses src/db/connection.ts)
 * - 20 pre-configured workspaces as documented
 * - Comprehensive error handling and logging
 * - Progress reporting
 * - Can run as part of server startup OR as separate script
 *
 * Note: This service requires PostgreSQL as it uses PostgreSQL-specific syntax
 * (uuid_generate_v4(), TEXT[], INTERVAL). For SQLite workflows, see src/automation/db/
 */

import db from "../db/connection";
import { logger } from "../utils/logger";

/**
 * Workspace configuration interface
 */
interface WorkspaceConfig {
  name: string;
  slug: string;
  description: string;
  type: "automation" | "data" | "integration" | "monitoring" | "development";
  features: string[];
  defaultTools: string[];
}

/**
 * Pre-configured workspace definitions (20 workspaces)
 */
const WORKSPACE_CONFIGS: WorkspaceConfig[] = [
  {
    name: "Web Automation",
    slug: "web-automation",
    description: "Browser automation and web scraping workflows",
    type: "automation",
    features: ["playwright", "form-filling", "data-extraction", "screenshots"],
    defaultTools: ["browser-manager", "form-filler", "data-extractor"],
  },
  {
    name: "Data Processing",
    slug: "data-processing",
    description: "ETL pipelines and data transformation workflows",
    type: "data",
    features: ["csv-processing", "json-transform", "data-validation"],
    defaultTools: ["csv-parser", "json-processor", "validator"],
  },
  {
    name: "API Integration",
    slug: "api-integration",
    description: "REST API and webhook integration workflows",
    type: "integration",
    features: ["rest-api", "webhooks", "oauth", "rate-limiting"],
    defaultTools: ["http-client", "webhook-handler", "oauth-manager"],
  },
  {
    name: "Email Automation",
    slug: "email-automation",
    description: "Email sending, parsing, and automation workflows",
    type: "automation",
    features: ["smtp", "imap", "email-templates", "attachments"],
    defaultTools: ["email-sender", "email-parser", "template-engine"],
  },
  {
    name: "Social Media",
    slug: "social-media",
    description: "Social media posting and monitoring workflows",
    type: "integration",
    features: ["twitter", "linkedin", "facebook", "scheduling"],
    defaultTools: ["social-poster", "content-scheduler", "analytics"],
  },
  {
    name: "File Management",
    slug: "file-management",
    description: "File upload, download, and processing workflows",
    type: "data",
    features: ["s3-storage", "file-conversion", "compression"],
    defaultTools: ["s3-manager", "file-converter", "compressor"],
  },
  {
    name: "Database Operations",
    slug: "database-ops",
    description: "Database queries, migrations, and backups",
    type: "data",
    features: ["sql-queries", "migrations", "backups", "replication"],
    defaultTools: ["query-builder", "migrator", "backup-manager"],
  },
  {
    name: "CI/CD Pipeline",
    slug: "cicd-pipeline",
    description: "Continuous integration and deployment workflows",
    type: "development",
    features: ["build", "test", "deploy", "rollback"],
    defaultTools: ["builder", "tester", "deployer"],
  },
  {
    name: "Monitoring & Alerts",
    slug: "monitoring-alerts",
    description: "System monitoring and alerting workflows",
    type: "monitoring",
    features: ["health-checks", "alerts", "metrics", "logs"],
    defaultTools: ["health-monitor", "alerter", "metrics-collector"],
  },
  {
    name: "Slack Integration",
    slug: "slack-integration",
    description: "Slack bot and notification workflows",
    type: "integration",
    features: ["slack-bot", "slash-commands", "notifications"],
    defaultTools: ["slack-bot", "command-handler", "notifier"],
  },
  {
    name: "GitHub Automation",
    slug: "github-automation",
    description: "GitHub PR, issue, and deployment automation",
    type: "development",
    features: ["pr-automation", "issue-tracking", "releases"],
    defaultTools: ["pr-manager", "issue-tracker", "release-manager"],
  },
  {
    name: "Content Generation",
    slug: "content-generation",
    description: "AI-powered content creation workflows",
    type: "automation",
    features: ["text-generation", "image-generation", "templates"],
    defaultTools: ["text-generator", "image-generator", "template-manager"],
  },
  {
    name: "E-commerce",
    slug: "ecommerce",
    description: "E-commerce order processing and inventory workflows",
    type: "integration",
    features: ["order-processing", "inventory", "payments", "shipping"],
    defaultTools: ["order-processor", "inventory-manager", "payment-handler"],
  },
  {
    name: "Analytics & Reporting",
    slug: "analytics-reporting",
    description: "Data analytics and report generation workflows",
    type: "data",
    features: ["dashboards", "reports", "charts", "export"],
    defaultTools: ["dashboard-builder", "report-generator", "chart-creator"],
  },
  {
    name: "Security Scanning",
    slug: "security-scanning",
    description: "Security vulnerability scanning workflows",
    type: "monitoring",
    features: ["code-scan", "dependency-scan", "secrets-scan"],
    defaultTools: ["code-scanner", "dependency-checker", "secrets-detector"],
  },
  {
    name: "Customer Support",
    slug: "customer-support",
    description: "Customer support ticket and chat workflows",
    type: "integration",
    features: ["ticket-management", "chat-bot", "knowledge-base"],
    defaultTools: ["ticket-manager", "chat-bot", "kb-manager"],
  },
  {
    name: "Marketing Automation",
    slug: "marketing-automation",
    description: "Marketing campaign and lead generation workflows",
    type: "automation",
    features: ["campaigns", "lead-generation", "email-marketing"],
    defaultTools: ["campaign-manager", "lead-generator", "email-marketer"],
  },
  {
    name: "Video Processing",
    slug: "video-processing",
    description: "Video upload, encoding, and streaming workflows",
    type: "data",
    features: ["upload", "encoding", "streaming", "thumbnails"],
    defaultTools: ["video-uploader", "encoder", "streamer"],
  },
  {
    name: "IoT & Sensors",
    slug: "iot-sensors",
    description: "IoT device and sensor data workflows",
    type: "integration",
    features: ["mqtt", "sensor-data", "device-management"],
    defaultTools: ["mqtt-client", "data-processor", "device-manager"],
  },
  {
    name: "Compliance & Audit",
    slug: "compliance-audit",
    description: "Compliance checking and audit trail workflows",
    type: "monitoring",
    features: ["compliance-check", "audit-logs", "reports"],
    defaultTools: ["compliance-checker", "audit-logger", "report-generator"],
  },
];

/**
 * Check if database is available and ready
 * @returns True if database is available, false otherwise
 */
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const result = await db.query("SELECT 1 as test");
    return result.rows.length > 0 && result.rows[0].test === 1;
  } catch (error) {
    logger.warn("Database availability check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Check if workspaces table exists
 * @returns True if table exists, false otherwise
 */
async function workspacesTableExists(): Promise<boolean> {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workspaces'
      ) as exists
    `);
    return result.rows[0].exists;
  } catch (error) {
    logger.error("Failed to check workspaces table existence", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Create workspaces table if it doesn't exist
 */
async function createWorkspacesTable(): Promise<void> {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        type VARCHAR(50),
        features TEXT[],
        default_tools TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logger.info("Workspaces table created successfully");
  } catch (error) {
    logger.error("Failed to create workspaces table", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Check if workspace already exists by slug
 * @param slug - Workspace slug
 * @returns True if workspace exists, false otherwise
 */
async function workspaceExists(slug: string): Promise<boolean> {
  try {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM workspaces WHERE slug = $1",
      [slug],
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    logger.error("Failed to check workspace existence", {
      error: error instanceof Error ? error.message : "Unknown error",
      slug,
    });
    return false;
  }
}

/**
 * Insert a single workspace
 * @param config - Workspace configuration
 * @returns True if successful, false otherwise
 */
async function insertWorkspace(config: WorkspaceConfig): Promise<boolean> {
  try {
    // Check if workspace already exists (idempotent)
    const exists = await workspaceExists(config.slug);

    if (exists) {
      logger.debug("Workspace already exists, skipping", { slug: config.slug });
      return true;
    }

    // Insert workspace
    await db.query(
      `INSERT INTO workspaces (name, slug, description, type, features, default_tools)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        config.name,
        config.slug,
        config.description,
        config.type,
        config.features,
        config.defaultTools,
      ],
    );

    logger.info("Workspace created successfully", {
      name: config.name,
      slug: config.slug,
    });

    return true;
  } catch (error) {
    logger.error("Failed to insert workspace", {
      error: error instanceof Error ? error.message : "Unknown error",
      workspace: config.name,
    });
    return false;
  }
}

/**
 * Initialize all workspaces
 * @returns Initialization result with statistics
 */
export async function initializeWorkspaces(): Promise<{
  success: boolean;
  message: string;
  stats: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
}> {
  const stats = {
    total: WORKSPACE_CONFIGS.length,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    logger.info("Starting workspace initialization", {
      totalWorkspaces: stats.total,
    });

    // Check database availability
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      logger.warn("Database not available, skipping workspace initialization");
      return {
        success: false,
        message: "Database not available",
        stats,
      };
    }

    // Check if workspaces table exists
    const tableExists = await workspacesTableExists();

    if (!tableExists) {
      logger.info("Workspaces table does not exist, creating...");
      await createWorkspacesTable();
    }

    // Insert all workspaces
    for (const config of WORKSPACE_CONFIGS) {
      const exists = await workspaceExists(config.slug);

      if (exists) {
        logger.debug("Workspace already exists, skipping", {
          slug: config.slug,
        });
        stats.skipped++;
        continue;
      }

      const success = await insertWorkspace(config);

      if (success) {
        stats.created++;
      } else {
        stats.failed++;
      }
    }

    logger.info("Workspace initialization completed", { stats });

    return {
      success: true,
      message: `Initialized ${stats.created} workspaces (${stats.skipped} already existed, ${stats.failed} failed)`,
      stats,
    };
  } catch (error) {
    logger.error("Workspace initialization failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stats,
    });

    return {
      success: false,
      message: "Workspace initialization failed",
      stats,
    };
  }
}

/**
 * Get workspace initialization status
 * @returns Status report with existing workspace count
 */
export async function getWorkspaceInitializationStatus(): Promise<{
  databaseAvailable: boolean;
  tableExists: boolean;
  workspaceCount: number;
  expectedCount: number;
}> {
  try {
    const databaseAvailable = await isDatabaseAvailable();

    if (!databaseAvailable) {
      return {
        databaseAvailable: false,
        tableExists: false,
        workspaceCount: 0,
        expectedCount: WORKSPACE_CONFIGS.length,
      };
    }

    const tableExists = await workspacesTableExists();

    if (!tableExists) {
      return {
        databaseAvailable: true,
        tableExists: false,
        workspaceCount: 0,
        expectedCount: WORKSPACE_CONFIGS.length,
      };
    }

    const result = await db.query("SELECT COUNT(*) as count FROM workspaces");
    const workspaceCount = parseInt(result.rows[0].count);

    return {
      databaseAvailable: true,
      tableExists: true,
      workspaceCount,
      expectedCount: WORKSPACE_CONFIGS.length,
    };
  } catch (error) {
    logger.error("Failed to get workspace initialization status", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      databaseAvailable: false,
      tableExists: false,
      workspaceCount: 0,
      expectedCount: WORKSPACE_CONFIGS.length,
    };
  }
}
