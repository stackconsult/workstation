#!/usr/bin/env node
/**
 * Manual Workspace Initialization Script
 * Run this script to manually initialize workspaces
 *
 * Usage:
 *   npm run build && node dist/scripts/initialize-workspaces.js
 *
 * Or directly with ts-node:
 *   npx ts-node src/scripts/initialize-workspaces.ts
 */

import dotenv from "dotenv";
dotenv.config();

import {
  initializeWorkspaces,
  getWorkspaceInitializationStatus,
} from "../services/workspace-initialization";
import { logger } from "../utils/logger";

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log("=".repeat(60));
    console.log("Workspace Initialization Script");
    console.log("=".repeat(60));
    console.log("");

    // Check current status
    console.log("Checking current workspace status...");
    const status = await getWorkspaceInitializationStatus();

    console.log("");
    console.log("Current Status:");
    console.log(
      `  Database Available: ${status.databaseAvailable ? "✓" : "✗"}`,
    );
    console.log(`  Workspaces Table: ${status.tableExists ? "✓" : "✗"}`);
    console.log(
      `  Existing Workspaces: ${status.workspaceCount} / ${status.expectedCount}`,
    );
    console.log("");

    if (!status.databaseAvailable) {
      console.error("❌ Database is not available");
      console.error(
        "   Please check your database connection settings in .env",
      );
      console.error("   Required environment variables:");
      console.error("     - DB_HOST");
      console.error("     - DB_PORT");
      console.error("     - DB_NAME");
      console.error("     - DB_USER");
      console.error("     - DB_PASSWORD");
      process.exit(1);
    }

    if (
      status.workspaceCount === status.expectedCount &&
      status.workspaceCount > 0
    ) {
      console.log("✓ All workspaces are already initialized");
      console.log("  No action needed");
      process.exit(0);
    }

    // Initialize workspaces
    console.log("Starting workspace initialization...");
    console.log("");

    const result = await initializeWorkspaces();

    console.log("");
    console.log("=".repeat(60));
    console.log("Initialization Results:");
    console.log("=".repeat(60));
    console.log(`  Status: ${result.success ? "✓ SUCCESS" : "✗ FAILED"}`);
    console.log(`  Message: ${result.message}`);
    console.log("");
    console.log("Statistics:");
    console.log(`  Total Workspaces: ${result.stats.total}`);
    console.log(`  Created: ${result.stats.created}`);
    console.log(`  Already Existed: ${result.stats.skipped}`);
    console.log(`  Failed: ${result.stats.failed}`);
    console.log("=".repeat(60));
    console.log("");

    if (result.success && result.stats.failed === 0) {
      console.log("✓ Workspace initialization completed successfully");
      process.exit(0);
    } else if (result.success && result.stats.failed > 0) {
      console.log("⚠ Workspace initialization completed with some failures");
      console.log("  Check logs for details");
      process.exit(0);
    } else {
      console.error("✗ Workspace initialization failed");
      console.error("  Check logs for details");
      process.exit(1);
    }
  } catch (error) {
    console.error("");
    console.error("❌ Fatal error during workspace initialization:");
    console.error(error instanceof Error ? error.message : "Unknown error");
    console.error("");
    logger.error("Workspace initialization script failed", {
      error: error instanceof Error ? error.stack : "Unknown error",
    });
    process.exit(1);
  }
}

// Run main function if executed directly
if (require.main === module) {
  main();
}
