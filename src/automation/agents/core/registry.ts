/**
 * Agent Registry - Phase 1 & Phase 10
 * Manages available agents and their capabilities
 */

import { BrowserAgent } from './browser';
import { EmailAgent } from '../integration/email';
import { SheetsAgent } from '../integration/sheets';
import { CalendarAgent } from '../integration/calendar';
import { FileAgent } from '../storage/file';
import { DatabaseAgent } from '../storage/database';
import { S3Agent } from '../storage/s3';
import { RssAgent } from '../data/rss';
import { CsvAgent } from '../data/csv';
import { JsonAgent } from '../data/json';
import { ExcelAgent } from '../data/excel';
import { PdfAgent } from '../data/pdf';
import { EnrichmentAgent } from '../utility/enrichment';
import { logger } from '../../../utils/logger';

export interface AgentCapability {
  agent_type: string;
  actions: string[];
  description: string;
}

export interface AgentAction {
  execute(params: Record<string, unknown>): Promise<unknown>;
}

export class AgentRegistry {
  private agents: Map<string, AgentAction> = new Map();
  private capabilities: AgentCapability[] = [];

  constructor() {
    this.registerDefaultAgents();
  }

  /**
   * Register default Phase 1 & Phase 10 agents
   */
  private registerDefaultAgents(): void {
    // Browser agent capabilities
    this.registerCapability({
      agent_type: 'browser',
      actions: ['navigate', 'click', 'type', 'getText', 'screenshot', 'getContent', 'evaluate'],
      description: 'Browser automation using Playwright'
    });

    // Phase 10: Workspace automation agents
    this.registerCapability({
      agent_type: 'email',
      actions: ['sendEmail', 'getUnreadEmails', 'markAsRead', 'createFilter'],
      description: 'Email automation (Gmail, Outlook, IMAP/SMTP)'
    });

    this.registerCapability({
      agent_type: 'file',
      actions: ['readFile', 'writeFile', 'listFiles', 'createDirectory', 'deleteFile', 'moveFile', 'copyFile', 'searchFiles'],
      description: 'File system operations (local and cloud storage)'
    });

    this.registerCapability({
      agent_type: 'rss',
      actions: ['fetchFeed', 'extractClientInfo', 'buildClientRepository', 'monitorFeeds'],
      description: 'RSS feed parsing and client intelligence gathering'
    });

    this.registerCapability({
      agent_type: 'sheets',
      actions: ['authenticate', 'readSheet', 'writeSheet', 'appendRows', 'updateCells', 'createSheet', 'listSheets', 'getSheetInfo'],
      description: 'Google Sheets integration with OAuth2 support'
    });

    this.registerCapability({
      agent_type: 'calendar',
      actions: ['authenticate', 'createEvent', 'listEvents', 'getEvent', 'updateEvent', 'deleteEvent', 'checkAvailability'],
      description: 'Google Calendar integration with OAuth2 support'
    });

    // Phase 10: Storage agents
    this.registerCapability({
      agent_type: 'database',
      actions: ['connect', 'disconnect', 'query', 'insert', 'update', 'delete', 'transaction', 'getTableInfo'],
      description: 'Database operations (PostgreSQL and SQLite)'
    });

    this.registerCapability({
      agent_type: 's3',
      actions: ['uploadFile', 'downloadFile', 'listFiles', 'deleteFile', 'getFileInfo', 'generatePresignedUrl', 'copyFile', 'moveFile'],
      description: 'S3 and S3-compatible cloud storage operations'
    });

    // Phase 1: Data agents
    this.registerCapability({
      agent_type: 'csv',
      actions: ['parseCsv', 'writeCsv', 'filterCsv', 'transformCsv', 'getStats'],
      description: 'CSV data parsing, transformation, and analysis'
    });

    this.registerCapability({
      agent_type: 'json',
      actions: ['parseJson', 'queryJson', 'validateJson', 'transformJson', 'stringifyJson', 'mergeJson'],
      description: 'JSON data parsing, querying, validation, and transformation'
    });

    this.registerCapability({
      agent_type: 'excel',
      actions: ['readExcel', 'writeExcel', 'getSheet', 'listSheets', 'formatCells', 'getInfo'],
      description: 'Excel file reading, writing, multi-sheet operations, and cell formatting'
    });

    this.registerCapability({
      agent_type: 'pdf',
      actions: ['extractText', 'extractTables', 'generatePdf', 'mergePdfs', 'getPdfInfo', 'splitPdf'],
      description: 'PDF text extraction, table extraction, generation, and manipulation'
    });

    // Phase 2: Utility agents
    this.registerCapability({
      agent_type: 'enrichment',
      actions: ['geocode', 'enrichCompanyData', 'enrichContact', 'batchEnrich', 'clearCache', 'getCacheStats'],
      description: 'Data enrichment with external APIs (geocoding, company info, contact enrichment)'
    });

    logger.info('Default agents registered', { count: this.capabilities.length });
  }

  /**
   * Register agent capability
   */
  registerCapability(capability: AgentCapability): void {
    this.capabilities.push(capability);
    logger.info('Agent capability registered', { agent_type: capability.agent_type });
  }

  /**
   * Get agent instance for execution
   */
  async getAgent(agentType: string, action: string): Promise<AgentAction | null> {
    const key = `${agentType}:${action}`;
    
    // Check if agent exists in cache
    if (this.agents.has(key)) {
      return this.agents.get(key)!;
    }

    // Create new agent instance
    if (agentType === 'browser') {
      const browserAgent = new BrowserAgent();
      await browserAgent.initialize();

      // Return action wrapper
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          try {
            switch (action) {
              case 'navigate': {
                await browserAgent.navigate(params as never);
                return { success: true };
              }
              
              case 'click': {
                await browserAgent.click(params as never);
                return { success: true };
              }
              
              case 'type': {
                await browserAgent.type(params as never);
                return { success: true };
              }
              
              case 'getText': {
                const text = await browserAgent.getText(params.selector as string);
                return { text };
              }
              
              case 'screenshot': {
                const screenshot = await browserAgent.screenshot(params as never);
                return { screenshot: screenshot.toString('base64') };
              }
              
              case 'getContent': {
                const content = await browserAgent.getContent();
                return { content };
              }
              
              case 'evaluate': {
                const result = await browserAgent.evaluate(params.function as never);
                return { result };
              }
              
              default:
                throw new Error(`Unknown action: ${action}`);
            }
          } finally {
            // Cleanup after action
            await browserAgent.cleanup();
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: Email agent
    if (agentType === 'email') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // Email config should be passed in params or retrieved from workspace config
          const emailConfig = (params as any).emailConfig || {
            provider: 'gmail' as const,
            email: 'default@example.com'
          };
          
          const emailAgent = new EmailAgent(emailConfig);
          await emailAgent.connect();

          try {
            switch (action) {
              case 'sendEmail':
                return await emailAgent.sendEmail(params as never);
              case 'getUnreadEmails':
                return await emailAgent.getUnreadEmails(params as never);
              case 'markAsRead':
                return await emailAgent.markAsRead(params.emailIds as string[]);
              case 'createFilter':
                return await emailAgent.createFilter(params as never);
              default:
                throw new Error(`Unknown email action: ${action}`);
            }
          } finally {
            await emailAgent.disconnect();
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: File agent
    if (agentType === 'file') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          const fileConfig = (params as any).fileConfig || {
            storageType: 'local' as const,
            basePath: '/tmp/workstation'
          };
          
          const fileAgent = new FileAgent(fileConfig);

          switch (action) {
            case 'readFile':
              return await fileAgent.readFile(params as never);
            case 'writeFile':
              return await fileAgent.writeFile(params as never);
            case 'listFiles':
              return await fileAgent.listFiles(params as never);
            case 'createDirectory':
              return await fileAgent.createDirectory(params as never);
            case 'deleteFile':
              return await fileAgent.deleteFile(params as never);
            case 'moveFile':
              return await fileAgent.moveFile(params as never);
            case 'copyFile':
              return await fileAgent.copyFile(params as never);
            case 'searchFiles':
              return await fileAgent.searchFiles(params as never);
            default:
              throw new Error(`Unknown file action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: RSS agent
    if (agentType === 'rss') {
      const rssAgent = new RssAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'fetchFeed':
              return await rssAgent.fetchFeed(params as never);
            case 'extractClientInfo':
              return await rssAgent.extractClientInfo(params as never);
            case 'buildClientRepository':
              return await rssAgent.buildClientRepository(params as never);
            case 'monitorFeeds':
              return await rssAgent.monitorFeeds(params as never);
            default:
              throw new Error(`Unknown RSS action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: Google Sheets agent
    if (agentType === 'sheets') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // Sheets config should be passed in params
          const sheetsConfig = (params as any).sheetsConfig || {
            authType: 'oauth2' as const,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI
          };
          
          const sheetsAgent = new SheetsAgent(sheetsConfig);

          try {
            switch (action) {
              case 'authenticate':
                return await sheetsAgent.authenticate();
              case 'readSheet':
                await sheetsAgent.authenticate();
                return await sheetsAgent.readSheet(params as never);
              case 'writeSheet':
                await sheetsAgent.authenticate();
                return await sheetsAgent.writeSheet(params as never);
              case 'appendRows':
                await sheetsAgent.authenticate();
                return await sheetsAgent.appendRows(params as never);
              case 'updateCells':
                await sheetsAgent.authenticate();
                return await sheetsAgent.updateCells(params as never);
              case 'createSheet':
                await sheetsAgent.authenticate();
                return await sheetsAgent.createSheet(params as never);
              case 'listSheets':
                await sheetsAgent.authenticate();
                return await sheetsAgent.listSheets(params as never);
              case 'getSheetInfo':
                await sheetsAgent.authenticate();
                return await sheetsAgent.getSheetInfo(params as never);
              default:
                throw new Error(`Unknown Google Sheets action: ${action}`);
            }
          } finally {
            await sheetsAgent.disconnect();
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: Google Calendar agent
    if (agentType === 'calendar') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // Calendar config should be passed in params
          const calendarConfig = (params as any).calendarConfig || {
            authType: 'oauth2' as const,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI
          };
          
          const calendarAgent = new CalendarAgent(calendarConfig);

          try {
            switch (action) {
              case 'authenticate':
                return await calendarAgent.authenticate();
              case 'createEvent':
                await calendarAgent.authenticate();
                return await calendarAgent.createEvent(params as never);
              case 'listEvents':
                await calendarAgent.authenticate();
                return await calendarAgent.listEvents(params as never);
              case 'getEvent':
                await calendarAgent.authenticate();
                return await calendarAgent.getEvent(params as never);
              case 'updateEvent':
                await calendarAgent.authenticate();
                return await calendarAgent.updateEvent(params as never);
              case 'deleteEvent':
                await calendarAgent.authenticate();
                return await calendarAgent.deleteEvent(params as never);
              case 'checkAvailability':
                await calendarAgent.authenticate();
                return await calendarAgent.checkAvailability(params as never);
              default:
                throw new Error(`Unknown Google Calendar action: ${action}`);
            }
          } finally {
            await calendarAgent.disconnect();
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 1: CSV agent
    if (agentType === 'csv') {
      const csvAgent = new CsvAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'parseCsv':
              return await csvAgent.parseCsv(params as never);
            case 'writeCsv':
              return await csvAgent.writeCsv(params as never);
            case 'filterCsv':
              return await csvAgent.filterCsv(params as never);
            case 'transformCsv':
              return await csvAgent.transformCsv(params as never);
            case 'getStats':
              return await csvAgent.getStats(params as never);
            default:
              throw new Error(`Unknown CSV action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 1: JSON agent
    if (agentType === 'json') {
      const jsonAgent = new JsonAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'parseJson':
              return await jsonAgent.parseJson(params as never);
            case 'queryJson':
              return await jsonAgent.queryJson(params as never);
            case 'validateJson':
              return await jsonAgent.validateJson(params as never);
            case 'transformJson':
              return await jsonAgent.transformJson(params as never);
            case 'stringifyJson':
              return await jsonAgent.stringifyJson(params as never);
            case 'mergeJson':
              return await jsonAgent.mergeJson(params as never);
            default:
              throw new Error(`Unknown JSON action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 1: Excel agent
    if (agentType === 'excel') {
      const excelAgent = new ExcelAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'readExcel':
              return await excelAgent.readExcel(params as never);
            case 'writeExcel':
              return await excelAgent.writeExcel(params as never);
            case 'getSheet':
              return await excelAgent.getSheet(params as never);
            case 'listSheets':
              return await excelAgent.listSheets(params as never);
            case 'formatCells':
              return await excelAgent.formatCells(params as never);
            case 'getInfo':
              return await excelAgent.getInfo(params as never);
            default:
              throw new Error(`Unknown Excel action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 1: PDF agent
    if (agentType === 'pdf') {
      const pdfAgent = new PdfAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'extractText':
              return await pdfAgent.extractText(params as never);
            case 'extractTables':
              return await pdfAgent.extractTables(params as never);
            case 'generatePdf':
              return await pdfAgent.generatePdf(params as never);
            case 'mergePdfs':
              return await pdfAgent.mergePdfs(params as never);
            case 'getPdfInfo':
              return await pdfAgent.getPdfInfo(params as never);
            case 'splitPdf':
              return await pdfAgent.splitPdf(params as never);
            default:
              throw new Error(`Unknown PDF action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: Database agent
    if (agentType === 'database') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // Database config should be passed in params
          const dbConfig = (params as any).dbConfig || {
            type: 'postgresql' as const,
            useExistingConnection: true
          };
          
          const databaseAgent = new DatabaseAgent(dbConfig);
          
          try {
            // Connect for operations (except connect/disconnect actions)
            if (action !== 'connect' && action !== 'disconnect') {
              await databaseAgent.connect();
            }

            switch (action) {
              case 'connect':
                return await databaseAgent.connect();
              case 'disconnect':
                return await databaseAgent.disconnect();
              case 'query':
                return await databaseAgent.query(params as never);
              case 'insert':
                return await databaseAgent.insert(params as never);
              case 'update':
                return await databaseAgent.update(params as never);
              case 'delete':
                return await databaseAgent.delete(params as never);
              case 'transaction':
                return await databaseAgent.transaction(params as never);
              case 'getTableInfo':
                return await databaseAgent.getTableInfo(params as never);
              default:
                throw new Error(`Unknown database action: ${action}`);
            }
          } finally {
            // Cleanup connection (except for connect/disconnect actions)
            if (action !== 'connect' && action !== 'disconnect') {
              await databaseAgent.disconnect();
            }
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 10: S3 agent
    if (agentType === 's3') {
      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          // S3 config should be passed in params or use environment variables
          const s3Config = (params as any).s3Config || {
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            bucket: process.env.AWS_S3_BUCKET || '',
            endpoint: process.env.AWS_S3_ENDPOINT,
            forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true'
          };
          
          const s3Agent = new S3Agent(s3Config);

          switch (action) {
            case 'uploadFile':
              return await s3Agent.uploadFile(params as never);
            case 'downloadFile':
              return await s3Agent.downloadFile(params as never);
            case 'listFiles':
              return await s3Agent.listFiles(params as never);
            case 'deleteFile':
              return await s3Agent.deleteFile(params as never);
            case 'getFileInfo':
              return await s3Agent.getFileInfo(params as never);
            case 'generatePresignedUrl':
              return await s3Agent.generatePresignedUrl(params as never);
            case 'copyFile':
              return await s3Agent.copyFile(params as never);
            case 'moveFile':
              return await s3Agent.moveFile(params as never);
            default:
              throw new Error(`Unknown S3 action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    // Phase 2: Enrichment agent
    if (agentType === 'enrichment') {
      const enrichmentAgent = new EnrichmentAgent();

      const actionWrapper: AgentAction = {
        execute: async (params: Record<string, unknown>) => {
          switch (action) {
            case 'geocode':
              return await enrichmentAgent.geocode(params as never);
            case 'enrichCompanyData':
              return await enrichmentAgent.enrichCompanyData(params as never);
            case 'enrichContact':
              return await enrichmentAgent.enrichContact(params as never);
            case 'batchEnrich':
              return await enrichmentAgent.batchEnrich(params as never);
            case 'clearCache':
              enrichmentAgent.clearCache();
              return { success: true, message: 'Cache cleared' };
            case 'getCacheStats':
              return enrichmentAgent.getCacheStats();
            default:
              throw new Error(`Unknown enrichment action: ${action}`);
          }
        }
      };

      this.agents.set(key, actionWrapper);
      return actionWrapper;
    }

    logger.warn('Unknown agent type requested', { agentType, action });
    return null;
  }

  /**
   * Get all available capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Check if agent supports action
   */
  supportsAction(agentType: string, action: string): boolean {
    const capability = this.capabilities.find(c => c.agent_type === agentType);
    return capability ? capability.actions.includes(action) : false;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
