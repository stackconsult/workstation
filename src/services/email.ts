/**
 * Email Service
 * Send password reset and notification emails
 */

import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@workstation.dev";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: "Password Reset Request - Workstation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          This link will expire in 1 hour.<br>
          If you didn't request this, please ignore this email.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Workstation - Browser Automation Platform
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      You requested to reset your password. Click the link below to set a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      If you didn't request this, please ignore this email.
    `,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("Email not sent - SMTP credentials not configured", {
        email,
      });
      logger.info("Password reset URL (dev mode)", { resetUrl });
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info("Password reset email sent", { email });
  } catch (error) {
    logger.error("Failed to send password reset email", { error, email });
    throw error;
  }
}

/**
 * Send workspace activation email
 */
export async function sendWorkspaceActivationEmail(
  email: string,
  workspaceName: string,
  workspaceSlug: string,
): Promise<void> {
  const activationUrl = `${APP_URL}/workspaces/${workspaceSlug}/activate`;

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `Workspace Activated - ${workspaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Workspace Activated!</h2>
        <p>Your workspace <strong>${workspaceName}</strong> has been successfully activated.</p>
        <p style="margin: 20px 0;">
          <a href="${activationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Access Workspace
          </a>
        </p>
        <p>You can now:</p>
        <ul>
          <li>Create and run automation workflows</li>
          <li>Integrate with Slack</li>
          <li>Invite team members</li>
          <li>Access all workspace features</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Workstation - Browser Automation Platform
        </p>
      </div>
    `,
    text: `
      Workspace Activated!
      
      Your workspace ${workspaceName} has been successfully activated.
      
      Access your workspace at: ${activationUrl}
      
      You can now create and run automation workflows, integrate with Slack, and invite team members.
    `,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("Email not sent - SMTP credentials not configured", {
        email,
      });
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info("Workspace activation email sent", { email, workspaceName });
  } catch (error) {
    logger.error("Failed to send workspace activation email", { error, email });
    // Don't throw - activation succeeded, email is just a notification
  }
}

/**
 * Send workspace invitation email
 */
export async function sendWorkspaceInvitationEmail(
  email: string,
  workspaceName: string,
  inviterName: string,
  token: string,
): Promise<void> {
  const inviteUrl = `${APP_URL}/workspace-invite?token=${token}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `Workspace Invitation - ${workspaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You've Been Invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong>.</p>
        <p style="margin: 20px 0;">
          <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${inviteUrl}</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          This invitation will expire in 7 days.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Workstation - Browser Automation Platform
        </p>
      </div>
    `,
    text: `
      You've Been Invited!
      
      ${inviterName} has invited you to join the workspace ${workspaceName}.
      
      Accept the invitation at: ${inviteUrl}
      
      This invitation will expire in 7 days.
    `,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("Email not sent - SMTP credentials not configured", {
        email,
      });
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info("Workspace invitation email sent", { email, workspaceName });
  } catch (error) {
    logger.error("Failed to send workspace invitation email", { error, email });
    throw error;
  }
}
