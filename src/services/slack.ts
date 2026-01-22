/**
 * Slack Integration Service
 * Handles Slack OAuth, slash commands, and interactive components
 */

import { App, BlockAction, ViewSubmitAction } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import db from "../db/connection";
import { logger } from "../utils/logger";

interface SlackWorkspaceConfig {
  workspaceId: string;
  slackTeamId: string;
  botToken: string;
  signingSecret: string;
}

/**
 * Initialize Slack app for a workspace
 */
export function initializeSlackApp(config: SlackWorkspaceConfig): App {
  const app = new App({
    token: config.botToken,
    signingSecret: config.signingSecret,
    socketMode: false, // Use HTTP mode for production
  });

  // Register slash commands
  registerSlashCommands(app, config.workspaceId);

  // Register interactive components
  registerInteractiveComponents(app, config.workspaceId);

  // Register event listeners
  registerEventListeners(app, config.workspaceId);

  logger.info("Slack app initialized for workspace", {
    workspaceId: config.workspaceId,
    teamId: config.slackTeamId,
  });

  return app;
}

/**
 * Register Slack slash commands
 */
function registerSlashCommands(app: App, workspaceId: string): void {
  // /workflow - List and manage workflows
  app.command(
    "/workflow",
    async ({ command, ack, respond, client: _client }) => {
      await ack();

      try {
        const subcommand = command.text.split(" ")[0];

        switch (subcommand) {
          case "list":
            await handleWorkflowList(workspaceId, respond);
            break;
          case "run":
            await handleWorkflowRun(workspaceId, command.text, respond);
            break;
          case "status":
            await handleWorkflowStatus(workspaceId, command.text, respond);
            break;
          default:
            await respond({
              text: "Workflow Management Commands",
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text:
                      "*Available Commands:*\n" +
                      "• `/workflow list` - List all workflows\n" +
                      "• `/workflow run <workflow-id>` - Run a workflow\n" +
                      "• `/workflow status <execution-id>` - Check workflow status",
                  },
                },
              ],
            });
        }
      } catch (error) {
        logger.error("Slack command error", { error, workspaceId });
        await respond({
          text: "An error occurred processing your command. Please try again.",
        });
      }
    },
  );

  // /workspace - Workspace management
  app.command("/workspace", async ({ command: _command, ack, respond }) => {
    await ack();

    try {
      const result = await db.query(
        `SELECT id, name, slug, description 
         FROM workspaces 
         WHERE id = $1`,
        [workspaceId],
      );

      if (result.rows.length === 0) {
        await respond({
          text: "Workspace not found.",
        });
        return;
      }

      const workspace = result.rows[0];

      await respond({
        text: `Workspace: ${workspace.name}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${workspace.name}*\n${workspace.description || "No description"}`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*ID:*\n${workspace.id}`,
              },
              {
                type: "mrkdwn",
                text: `*Slug:*\n${workspace.slug}`,
              },
            ],
          },
        ],
      });
    } catch (error) {
      logger.error("Workspace command error", { error, workspaceId });
      await respond({
        text: "An error occurred. Please try again.",
      });
    }
  });

  // /agent - Agent management
  app.command("/agent", async ({ command, ack, respond }) => {
    await ack();

    try {
      const subcommand = command.text.split(" ")[0];

      if (subcommand === "list") {
        const result = await db.query(
          `SELECT name, agent_number, type, status 
           FROM agents 
           ORDER BY agent_number ASC`,
        );

        const agentList = result.rows
          .map(
            (agent: { agent_number: number; name: string; status: string }) =>
              `${agent.agent_number}. ${agent.name} - \`${agent.status}\``,
          )
          .join("\n");

        await respond({
          text: "Available Agents",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Available Agents:*\n${agentList}`,
              },
            },
          ],
        });
      } else {
        await respond({
          text: "Use `/agent list` to see all available agents",
        });
      }
    } catch (error) {
      logger.error("Agent command error", { error, workspaceId });
      await respond({
        text: "An error occurred. Please try again.",
      });
    }
  });
}

/**
 * Register interactive components (buttons, select menus, modals)
 */
function registerInteractiveComponents(app: App, workspaceId: string): void {
  // Button click handler - Run workflow
  app.action<BlockAction>(
    "run_workflow",
    async ({ action, ack, respond, body }) => {
      await ack();

      try {
        const workflowId = (action as { value: string }).value;

        // Create workflow execution
        const result = await db.query(
          `INSERT INTO workflow_executions (workflow_id, status, metadata)
         VALUES ($1, 'pending', $2)
         RETURNING id`,
          [
            workflowId,
            JSON.stringify({ source: "slack", user_id: body.user.id }),
          ],
        );

        const executionId = result.rows[0].id;

        await respond({
          text: `Workflow execution started!`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `✅ Workflow execution started\n*Execution ID:* ${executionId}`,
              },
            },
          ],
        });

        logger.info("Workflow started from Slack", {
          workspaceId,
          workflowId,
          executionId,
          slackUserId: body.user.id,
        });
      } catch (error) {
        logger.error("Run workflow error", { error, workspaceId });
        await respond({
          text: "Failed to start workflow. Please try again.",
        });
      }
    },
  );

  // Modal submission - Create workflow
  app.view<ViewSubmitAction>(
    "create_workflow_modal",
    async ({ ack, view, body }) => {
      await ack();

      try {
        const values = view.state.values;
        const name = values.workflow_name.name_input.value || "";
        const description =
          values.workflow_description?.description_input?.value || "";

        await db.query(
          `INSERT INTO saved_workflows (name, description, workflow_definition, category)
         VALUES ($1, $2, $3, 'slack-created')`,
          [name, description, JSON.stringify({ source: "slack" })],
        );

        logger.info("Workflow created from Slack", {
          workspaceId,
          name,
          slackUserId: body.user.id,
        });
      } catch (error) {
        logger.error("Create workflow error", { error, workspaceId });
      }
    },
  );
}

/**
 * Register Slack event listeners
 */
function registerEventListeners(app: App, workspaceId: string): void {
  // App mention - @bot
  app.event("app_mention", async ({ event, say }) => {
    try {
      await say({
        text: `Hi <@${event.user}>! I'm your Workstation automation assistant.`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `Hi <@${event.user}>! I'm your Workstation automation assistant.\n\n` +
                `Try these commands:\n` +
                `• \`/workflow list\` - See all workflows\n` +
                `• \`/agent list\` - See all agents\n` +
                `• \`/workspace\` - Workspace info`,
            },
          },
        ],
      });

      logger.info("App mention handled", { workspaceId, userId: event.user });
    } catch (error) {
      logger.error("App mention error", { error, workspaceId });
    }
  });

  // Message in channels where bot is present
  app.message("help", async ({ say }) => {
    await say({
      text: "Workstation Help",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "*Workstation Automation Platform*\n\n" +
              "Available slash commands:\n" +
              "• `/workflow` - Workflow management\n" +
              "• `/agent` - Agent management\n" +
              "• `/workspace` - Workspace info",
          },
        },
      ],
    });
  });
}

/**
 * Helper: Handle workflow list command
 */
async function handleWorkflowList(
  workspaceId: string,
  respond: (message: string | Record<string, unknown>) => Promise<void>,
): Promise<void> {
  const result = await db.query(
    `SELECT id, name, description, execution_count, success_rate
     FROM saved_workflows
     WHERE is_public = true OR user_id IN (
       SELECT user_id FROM workspace_members WHERE workspace_id = $1
     )
     ORDER BY execution_count DESC
     LIMIT 10`,
    [workspaceId],
  );

  if (result.rows.length === 0) {
    await respond({
      text: "No workflows found. Create one to get started!",
    });
    return;
  }

  const workflowBlocks = result.rows.map(
    (workflow: {
      id: string;
      name: string;
      description: string;
      execution_count: number;
      success_rate: number;
    }) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*${workflow.name}*\n${workflow.description || "No description"}\n` +
          `Executions: ${workflow.execution_count} | Success Rate: ${workflow.success_rate || 0}%`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Run",
        },
        action_id: "run_workflow",
        value: workflow.id,
      },
    }),
  );

  await respond({
    text: "Available Workflows",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Available Workflows*",
        },
      },
      ...workflowBlocks,
    ],
  });
}

/**
 * Helper: Handle workflow run command
 */
async function handleWorkflowRun(
  workspaceId: string,
  commandText: string,
  respond: (message: string | Record<string, unknown>) => Promise<void>,
): Promise<void> {
  const workflowId = commandText.split(" ")[1];

  if (!workflowId) {
    await respond({
      text: "Please specify a workflow ID: `/workflow run <workflow-id>`",
    });
    return;
  }

  // Create execution
  const result = await db.query(
    `INSERT INTO workflow_executions (workflow_id, status, metadata)
     VALUES ($1, 'pending', $2)
     RETURNING id`,
    [workflowId, JSON.stringify({ source: "slack" })],
  );

  await respond({
    text: `Workflow execution started! ID: ${result.rows[0].id}`,
  });
}

/**
 * Helper: Handle workflow status command
 */
async function handleWorkflowStatus(
  workspaceId: string,
  commandText: string,
  respond: (message: string | Record<string, unknown>) => Promise<void>,
): Promise<void> {
  const executionId = commandText.split(" ")[1];

  if (!executionId) {
    await respond({
      text: "Please specify an execution ID: `/workflow status <execution-id>`",
    });
    return;
  }

  const result = await db.query(
    `SELECT we.id, we.status, we.started_at, we.completed_at, we.steps_completed, we.total_steps,
            sw.name as workflow_name
     FROM workflow_executions we
     LEFT JOIN saved_workflows sw ON we.workflow_id = sw.id
     WHERE we.id = $1`,
    [executionId],
  );

  if (result.rows.length === 0) {
    await respond({
      text: "Execution not found.",
    });
    return;
  }

  const execution = result.rows[0];
  const statusEmoji =
    execution.status === "completed"
      ? "✅"
      : execution.status === "failed"
        ? "❌"
        : "⏳";

  await respond({
    text: `Workflow Status: ${execution.status}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `${statusEmoji} *${execution.workflow_name || "Workflow"}*\n` +
            `Status: \`${execution.status}\`\n` +
            `Progress: ${execution.steps_completed}/${execution.total_steps} steps\n` +
            `Started: ${new Date(execution.started_at).toLocaleString()}`,
        },
      },
    ],
  });
}

/**
 * Get Slack client for a workspace
 */
export async function getSlackClient(
  workspaceId: string,
): Promise<WebClient | null> {
  try {
    const result = await db.query(
      "SELECT slack_bot_token FROM workspaces WHERE id = $1 AND slack_bot_token IS NOT NULL",
      [workspaceId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new WebClient(result.rows[0].slack_bot_token);
  } catch (error) {
    logger.error("Failed to get Slack client", { error, workspaceId });
    return null;
  }
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  workspaceId: string,
  channel: string,
  text: string,
  blocks?: Record<string, unknown>[],
): Promise<void> {
  try {
    const client = await getSlackClient(workspaceId);

    if (!client) {
      logger.warn("No Slack client available for workspace", { workspaceId });
      return;
    }

    await client.chat.postMessage({
      channel,
      text,
      ...(blocks && { blocks }),
    });

    logger.info("Slack message sent", { workspaceId, channel });
  } catch (error) {
    logger.error("Failed to send Slack message", {
      error,
      workspaceId,
      channel,
    });
    throw error;
  }
}
