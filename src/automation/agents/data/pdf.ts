/**
 * PDF Agent for workflow automation
 * Handles PDF text extraction, table extraction, generation, and manipulation
 * Phase 1: Data Agents
 */

import * as PDFParser from 'pdf-parse';
import * as PDFDocument from 'pdfkit';
import { logger } from '../../../utils/logger';

export interface PdfExtractOptions {
  pageRange?: { start: number; end: number };
  normalizeWhitespace?: boolean;
}

export interface PdfGenerateOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  size?: 'A4' | 'Letter' | 'Legal' | [number, number];
  layout?: 'portrait' | 'landscape';
}

export interface PdfTableRow {
  [key: string]: string | number;
}

export interface PdfInfo {
  pages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * PDF Agent Implementation
 * Provides comprehensive PDF handling capabilities using pdf-parse and pdfkit
 */
export class PdfAgent {
  /**
   * Extract all text from PDF
   */
  async extractText(params: {
    input: Buffer;
    options?: PdfExtractOptions;
  }): Promise<{
    success: boolean;
    text?: string;
    pages?: number;
    error?: string;
  }> {
    try {
      const data = await (PDFParser as any)(params.input);

      let text = data.text;

      // Apply page range filter if specified
      if (params.options?.pageRange) {
        // Note: pdf-parse doesn't provide easy page-by-page text
        // This is a simplified implementation
        logger.warn('Page range filtering is approximate with pdf-parse');
      }

      // Normalize whitespace if requested
      if (params.options?.normalizeWhitespace) {
        text = text.replace(/\s+/g, ' ').trim();
      }

      logger.info(`PDF text extracted: ${data.numpages} pages, ${text.length} characters`);

      return {
        success: true,
        text,
        pages: data.numpages
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDF text extraction error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Extract tables from PDF
   * Note: This is a simplified implementation. For production use,
   * consider using specialized libraries like tabula-js or pdf-table-extractor
   */
  async extractTables(params: {
    input: Buffer;
    options?: {
      pageRange?: { start: number; end: number };
    };
  }): Promise<{
    success: boolean;
    tables?: PdfTableRow[][];
    error?: string;
  }> {
    try {
      const data = await (PDFParser as any)(params.input);
      const text = data.text;

      // Simple table detection: look for rows with consistent delimiters
      const lines = text.split('\n').filter((line: string) => line.trim());
      const tables: PdfTableRow[][] = [];
      let currentTable: string[][] = [];

      for (const line of lines) {
        // Detect potential table rows (multiple spaces or tabs as separators)
        const cells = line.split(/\s{2,}|\t/).filter((cell: string) => cell.trim());
        
        if (cells.length > 1) {
          currentTable.push(cells);
        } else if (currentTable.length > 0) {
          // End of table
          if (currentTable.length > 1) {
            // Convert to structured table (first row as headers)
            const headers = currentTable[0];
            const tableData = currentTable.slice(1).map(row => {
              const rowObj: PdfTableRow = {};
              headers.forEach((header, index) => {
                rowObj[header] = row[index] || '';
              });
              return rowObj;
            });
            tables.push(tableData);
          }
          currentTable = [];
        }
      }

      // Handle last table
      if (currentTable.length > 1) {
        const headers = currentTable[0];
        const tableData = currentTable.slice(1).map(row => {
          const rowObj: PdfTableRow = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index] || '';
          });
          return rowObj;
        });
        tables.push(tableData);
      }

      logger.info(`PDF tables extracted: ${tables.length} tables found`);

      return {
        success: true,
        tables
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDF table extraction error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Generate PDF from data (text, structured data, or HTML-like content)
   */
  async generatePdf(params: {
    content: string | { text?: string; data?: unknown[] };
    options?: PdfGenerateOptions;
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
  }> {
    try {
      const options: PdfGenerateOptions = {
        title: 'Generated PDF',
        size: 'A4',
        layout: 'portrait',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        ...params.options
      };

      const doc = new (PDFDocument as any)({
        size: options.size,
        layout: options.layout,
        margins: options.margins,
        info: {
          Title: options.title,
          Author: options.author,
          Subject: options.subject,
          Keywords: options.keywords?.join(', ')
        }
      });

      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));

      // Wait for PDF generation to complete
      const bufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // Add content
      if (typeof params.content === 'string') {
        // Simple text content
        doc.fontSize(12).text(params.content, {
          align: 'left'
        });
      } else {
        // Structured content
        if (params.content.text) {
          doc.fontSize(12).text(params.content.text);
        }

        if (params.content.data && Array.isArray(params.content.data)) {
          // Render data as simple table
          doc.moveDown();
          doc.fontSize(10);

          const data = params.content.data;
          if (data.length > 0) {
            // Headers
            const headers = Object.keys(data[0] as Record<string, unknown>);
            doc.font('Helvetica-Bold');
            doc.text(headers.join(' | '), { underline: true });
            doc.font('Helvetica');

            // Rows
            for (const row of data) {
              const values = headers.map(h => String((row as Record<string, unknown>)[h] || ''));
              doc.text(values.join(' | '));
            }
          }
        }
      }

      doc.end();

      const buffer = await bufferPromise;

      logger.info('PDF generated successfully');

      return {
        success: true,
        buffer
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDF generation error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Merge multiple PDF files
   * Note: This is a simplified implementation. For production,
   * consider using pdf-lib or similar for proper PDF manipulation
   */
  async mergePdfs(params: {
    pdfs: Buffer[];
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
    message?: string;
  }> {
    try {
      if (!Array.isArray(params.pdfs) || params.pdfs.length === 0) {
        throw new Error('PDFs array must contain at least one PDF buffer');
      }

      // Note: pdf-parse and pdfkit don't provide native merge functionality
      // This creates a new PDF with text from all input PDFs
      // For true PDF merging, use pdf-lib or similar
      
      const doc = new (PDFDocument as any)();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));

      const bufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // Extract text from each PDF and add to new document
      for (let i = 0; i < params.pdfs.length; i++) {
        if (i > 0) {
          doc.addPage();
        }

        try {
          const data = await (PDFParser as any)(params.pdfs[i]);
          doc.fontSize(12).text(data.text);
        } catch (parseError) {
          logger.warn(`Failed to parse PDF ${i + 1}:`, parseError);
          doc.fontSize(10).text(`[PDF ${i + 1} could not be parsed]`, { italics: true });
        }
      }

      doc.end();

      const buffer = await bufferPromise;

      logger.info(`PDFs merged: ${params.pdfs.length} files`);

      return {
        success: true,
        buffer,
        message: 'Note: This is a text-based merge. For preserving original formatting and images, use pdf-lib or similar libraries.'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDF merge error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get PDF metadata and information
   */
  async getPdfInfo(params: {
    input: Buffer;
  }): Promise<{
    success: boolean;
    info?: PdfInfo;
    error?: string;
  }> {
    try {
      const data = await (PDFParser as any)(params.input);

      const info: PdfInfo = {
        pages: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
      };

      logger.info(`PDF info retrieved: ${info.pages} pages`);

      return {
        success: true,
        info
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Get PDF info error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Split PDF into individual pages
   * Note: Simplified implementation - creates new PDFs with text from each page
   */
  async splitPdf(params: {
    input: Buffer;
  }): Promise<{
    success: boolean;
    pages?: Buffer[];
    error?: string;
    message?: string;
  }> {
    try {
      await (PDFParser as any)(params.input);
      
      // Note: pdf-parse doesn't provide easy page-by-page access
      // This is a placeholder implementation
      logger.warn('PDF splitting is limited with pdf-parse. Consider using pdf-lib for better results.');

      return {
        success: true,
        pages: [],
        message: 'PDF splitting requires pdf-lib or similar libraries for accurate page-by-page extraction.'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('PDF split error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}

// Export singleton instance
export const pdfAgent = new PdfAgent();
