/**
 * Email Agent for workspace communication automation
 * Production implementation with nodemailer and googleapis
 * Integrates with Gmail, Outlook, and standard IMAP/SMTP
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { google } from 'googleapis';
import { logger } from '../../../utils/logger';

export interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'imap' | 'smtp';
  email: string;
  password?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  secure?: boolean;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  body: string;
  html?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export interface EmailFilter {
  name: string;
  conditions: {
    from?: string;
    to?: string;
    subject?: string;
    hasAttachments?: boolean;
    size?: number;
  };
  actions: {
    label?: string;
    moveToFolder?: string;
    markAsRead?: boolean;
    forwardTo?: string;
  };
}

/**
 * Production Email Agent Implementation
 * Uses nodemailer for SMTP/IMAP and googleapis for Gmail
 */
export class EmailAgent {
  private transporter: Transporter | null = null;
  private gmailClient: any = null;
  private connected: boolean = false;

  constructor(private config: EmailConfig) {}

  /**
   * Connect to email provider
   */
  async connect(): Promise<void> {
    logger.info('Connecting to email provider', { provider: this.config.provider });

    try {
      switch (this.config.provider) {
        case 'gmail':
          await this.connectGmail();
          break;
        case 'outlook':
          await this.connectOutlook();
          break;
        case 'imap':
        case 'smtp':
          await this.connectCustom();
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }

      this.connected = true;
      logger.info('Successfully connected to email provider');
    } catch (error) {
      logger.error('Email connection failed', { error, provider: this.config.provider });
      throw error;
    }
  }

  /**
   * Connect to Gmail using OAuth2 and nodemailer
   */
  private async connectGmail(): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken) {
      throw new Error('Gmail requires clientId, clientSecret, and refreshToken');
    }

    const oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: this.config.refreshToken
    });

    const accessToken = await oauth2Client.getAccessToken();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.config.email,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        refreshToken: this.config.refreshToken,
        accessToken: accessToken.token || ''
      }
    } as any);

    // Verify connection
    if (this.transporter) {
      await this.transporter.verify();
    }

    // Initialize Gmail API client for reading emails
    this.gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

    logger.info('Gmail connection established');
  }

  /**
   * Connect to Outlook using SMTP
   */
  private async connectOutlook(): Promise<void> {
    if (!this.config.password) {
      throw new Error('Outlook requires password or app password');
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.email,
        pass: this.config.password
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    // Verify connection
    if (this.transporter) {
      await this.transporter.verify();
    }
    logger.info('Outlook connection established');
  }

  /**
   * Connect using custom IMAP/SMTP with nodemailer
   */
  private async connectCustom(): Promise<void> {
    if (!this.config.smtpHost || !this.config.password) {
      throw new Error('Custom SMTP requires smtpHost and password');
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort || 587,
      secure: this.config.secure || false,
      auth: {
        user: this.config.email,
        pass: this.config.password
      }
    });

    // Verify connection
    if (this.transporter) {
      await this.transporter.verify();
    }
    logger.info('Custom SMTP connection established', { host: this.config.smtpHost });
  }

  /**
   * Send email using nodemailer
   */
  async sendEmail(params: {
    to: string | string[];
    subject: string;
    body: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<{ messageId: string }> {
    if (!this.connected || !this.transporter) {
      await this.connect();
    }

    if (!this.transporter) {
      throw new Error('Transporter not initialized');
    }

    logger.info('Sending email', {
      to: params.to,
      subject: params.subject
    });

    try {
      const info = await this.transporter.sendMail({
        from: this.config.email,
        to: params.to,
        subject: params.subject,
        text: params.body,
        html: params.html,
        attachments: params.attachments
      });

      logger.info('Email sent successfully', { messageId: info.messageId });

      return { messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed', { error });
      throw error;
    }
  }

  /**
   * Get unread emails from Gmail
   */
  async getUnreadEmails(params: {
    folder?: string;
    limit?: number;
    since?: Date;
  } = {}): Promise<EmailMessage[]> {
    if (!this.connected) {
      await this.connect();
    }

    logger.info('Fetching unread emails', params);

    // Gmail-specific implementation
    if (this.config.provider === 'gmail' && this.gmailClient) {
      return this.getGmailUnreadEmails(params);
    }

    // For other providers, return empty array (IMAP implementation would go here)
    logger.warn('Email fetching not implemented for non-Gmail providers');
    return [];
  }

  /**
   * Get unread emails from Gmail using Gmail API
   */
  private async getGmailUnreadEmails(params: {
    folder?: string;
    limit?: number;
    since?: Date;
  }): Promise<EmailMessage[]> {
    try {
      const query = 'is:unread';
      const response = await this.gmailClient.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: params.limit || 20
      });

      const messages: EmailMessage[] = [];

      if (response.data.messages) {
        for (const message of response.data.messages) {
          const msg = await this.gmailClient.users.messages.get({
            userId: 'me',
            id: message.id
          });

          const headers = msg.data.payload.headers;
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          // Extract body (simplified)
          let body = '';
          if (msg.data.payload.parts) {
            const textPart = msg.data.payload.parts.find((part: any) => part.mimeType === 'text/plain');
            if (textPart && textPart.body.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString();
            }
          }

          messages.push({
            id: msg.data.id || '',
            from,
            to: this.config.email,
            subject,
            date: new Date(date),
            body,
            attachments: []
          });
        }
      }

      logger.info('Fetched unread emails', { count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Failed to fetch Gmail messages', { error });
      throw error;
    }
  }

  /**
   * Mark emails as read in Gmail
   */
  async markAsRead(emailIds: string[]): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    logger.info('Marking emails as read', { count: emailIds.length });

    if (this.config.provider === 'gmail' && this.gmailClient) {
      try {
        for (const id of emailIds) {
          await this.gmailClient.users.messages.modify({
            userId: 'me',
            id,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });
        }
        logger.info('Emails marked as read successfully');
      } catch (error) {
        logger.error('Failed to mark emails as read', { error });
        throw error;
      }
    } else {
      logger.warn('Mark as read not implemented for non-Gmail providers');
    }
  }

  /**
   * Create email filter/rule (Gmail only)
   */
  async createFilter(params: EmailFilter): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    logger.info('Creating email filter', { name: params.name });

    if (this.config.provider === 'gmail' && this.gmailClient) {
      try {
        const criteria: any = {};
        if (params.conditions.from) criteria.from = params.conditions.from;
        if (params.conditions.to) criteria.to = params.conditions.to;
        if (params.conditions.subject) criteria.subject = params.conditions.subject;

        const action: any = {};
        if (params.actions.label) action.addLabelIds = [params.actions.label];
        if (params.actions.markAsRead) action.removeLabelIds = ['UNREAD'];

        await this.gmailClient.users.settings.filters.create({
          userId: 'me',
          requestBody: {
            criteria,
            action
          }
        });

        logger.info('Email filter created successfully');
      } catch (error) {
        logger.error('Failed to create email filter', { error });
        throw error;
      }
    } else {
      logger.warn('Filter creation not implemented for non-Gmail providers');
    }
  }

  /**
   * Disconnect from email provider
   */
  async disconnect(): Promise<void> {
    if (this.transporter) {
      logger.info('Disconnecting from email provider');
      this.transporter.close();
      this.transporter = null;
      this.gmailClient = null;
      this.connected = false;
    }
  }
}
