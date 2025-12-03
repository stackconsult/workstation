/**
 * Phase 6: Initialize Workspaces
 * Creates 20 generic workspaces with secure random passwords
 */

import crypto from "crypto";
import bcrypt from "bcrypt";
import db from "../db/connection";
import { logger } from "../utils/logger";

interface WorkspaceConfig {
  name: string;
  slug: string;
  username: string;
  description: string;
}

const WORKSPACE_CONFIGS: WorkspaceConfig[] = [
  {
    name: "Workspace Alpha",
    slug: "workspace-alpha",
    username: "ws_alpha_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Beta",
    slug: "workspace-beta",
    username: "ws_beta_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Gamma",
    slug: "workspace-gamma",
    username: "ws_gamma_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Delta",
    slug: "workspace-delta",
    username: "ws_delta_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Epsilon",
    slug: "workspace-epsilon",
    username: "ws_epsilon_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Zeta",
    slug: "workspace-zeta",
    username: "ws_zeta_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Eta",
    slug: "workspace-eta",
    username: "ws_eta_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Theta",
    slug: "workspace-theta",
    username: "ws_theta_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Iota",
    slug: "workspace-iota",
    username: "ws_iota_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Kappa",
    slug: "workspace-kappa",
    username: "ws_kappa_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Lambda",
    slug: "workspace-lambda",
    username: "ws_lambda_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Mu",
    slug: "workspace-mu",
    username: "ws_mu_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Nu",
    slug: "workspace-nu",
    username: "ws_nu_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Xi",
    slug: "workspace-xi",
    username: "ws_xi_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Omicron",
    slug: "workspace-omicron",
    username: "ws_omicron_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Pi",
    slug: "workspace-pi",
    username: "ws_pi_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Rho",
    slug: "workspace-rho",
    username: "ws_rho_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Sigma",
    slug: "workspace-sigma",
    username: "ws_sigma_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Tau",
    slug: "workspace-tau",
    username: "ws_tau_user",
    description: "Generic workspace for initial setup",
  },
  {
    name: "Workspace Upsilon",
    slug: "workspace-upsilon",
    username: "ws_upsilon_user",
    description: "Generic workspace for initial setup",
  },
];

export async function initializeWorkspaces(): Promise<void> {
  try {
    // Security Note: Each workspace gets a unique random password instead of shared default
    // Passwords are logged for admin access and should be stored securely
    logger.info(
      "Initializing 20 generic workspaces with unique random passwords...",
    );

    const createdWorkspaces: Array<{
      name: string;
      slug: string;
      username: string;
      password: string;
    }> = [];
    let created = 0;
    let existing = 0;

    for (const config of WORKSPACE_CONFIGS) {
      try {
        // Generate cryptographically secure random password (16 characters)
        const randomPassword = crypto
          .randomBytes(16)
          .toString("base64")
          .slice(0, 16);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        const result = await db.query(
          `INSERT INTO workspaces (name, slug, generic_username, generic_password_hash, description, status, is_activated)
           VALUES ($1, $2, $3, $4, $5, 'active', false)
           ON CONFLICT (slug) DO NOTHING
           RETURNING id`,
          [
            config.name,
            config.slug,
            config.username,
            passwordHash,
            config.description,
          ],
        );

        if (result.rows.length > 0) {
          created++;
          createdWorkspaces.push({
            name: config.name,
            slug: config.slug,
            username: config.username,
            password: randomPassword,
          });
          logger.info(`Created workspace: ${config.name} (${config.slug})`);
        } else {
          existing++;
          logger.debug(`Workspace already exists: ${config.slug}`);
        }
      } catch (error) {
        logger.error(`Failed to create workspace ${config.slug}`, { error });
      }
    }

    logger.info(
      `Workspace initialization complete: ${created} created, ${existing} already existed`,
    );

    if (created > 0) {
      logger.warn("=".repeat(80));
      logger.warn("WORKSPACE CREDENTIALS - STORE SECURELY AND DELETE THIS LOG");
      logger.warn("=".repeat(80));
      logger.warn(
        "The following credentials are for initial workspace access only.",
      );
      logger.warn(
        "Users MUST activate workspaces with their own email/password.",
      );
      logger.warn(
        "These generic credentials will be disabled after activation.",
      );
      logger.warn("");

      for (const ws of createdWorkspaces) {
        logger.warn(`${ws.slug}:`);
        logger.warn(`  Name: ${ws.name}`);
        logger.warn(`  Username: ${ws.username}`);
        logger.warn(`  Password: ${ws.password}`);
        logger.warn("");
      }

      logger.warn("=".repeat(80));
      logger.warn(
        "IMPORTANT: Copy these credentials to a secure location and delete this log!",
      );
      logger.warn("=".repeat(80));
    }
  } catch (error) {
    logger.error("Failed to initialize workspaces", { error });
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  initializeWorkspaces()
    .then(() => {
      logger.info("Workspace initialization script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Workspace initialization script failed", { error });
      process.exit(1);
    });
}
