/// <reference types="jest" />

import { PdfAgent, pdfAgent } from '../../../src/automation/agents/data/pdf';
import * as PDFDocument from 'pdfkit';

describe('PDF Agent', () => {
  let agent: PdfAgent;

  beforeEach(() => {
    agent = new PdfAgent();
  });

  // Helper to create a simple PDF buffer
  const createSimplePdf = (text: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.text(text);
      doc.end();
    });
  };

  describe('extractText', () => {
    it('should extract text from PDF', async () => {
      const pdfBuffer = await createSimplePdf('Hello World Test Document');

      const result = await agent.extractText({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.text).toContain('Hello World');
      expect(result.pages).toBeGreaterThan(0);
    });

    it('should handle multi-page PDFs', async () => {
      const doc = new (PDFDocument as any)();
      const chunks: Buffer[] = [];

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('Page 1 content');
        doc.addPage();
        doc.text('Page 2 content');
        doc.end();
      });

      const result = await agent.extractText({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.pages).toBe(2);
    });

    it('should normalize whitespace when requested', async () => {
      const pdfBuffer = await createSimplePdf('Text   with    extra    spaces');

      const result = await agent.extractText({ 
        input: pdfBuffer,
        options: { normalizeWhitespace: true }
      });

      expect(result.success).toBe(true);
      expect(result.text).not.toContain('  '); // No double spaces
    });

    it('should handle invalid PDF gracefully', async () => {
      const invalidBuffer = Buffer.from('not a valid PDF file');

      const result = await agent.extractText({ input: invalidBuffer });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty PDF', async () => {
      const emptyPdf = await createSimplePdf('');

      const result = await agent.extractText({ input: emptyPdf });

      expect(result.success).toBe(true);
      expect(result.text).toBeDefined();
      expect(result.pages).toBe(1);
    });
  });

  describe('extractTables', () => {
    it('should extract basic table data', async () => {
      const tableText = 'Name Age\nJohn 30\nJane 25';
      const pdfBuffer = await createSimplePdf(tableText);

      const result = await agent.extractTables({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.tables).toBeDefined();
      expect(Array.isArray(result.tables)).toBe(true);
    });

    it('should handle PDFs without tables', async () => {
      const pdfBuffer = await createSimplePdf('This is just regular text without tables');

      const result = await agent.extractTables({ input: pdfBuffer });

      expect(result.success).toBe(true);
      // May return empty array or basic text detection
      expect(Array.isArray(result.tables)).toBe(true);
    });

    it('should handle invalid PDF in table extraction', async () => {
      const invalidBuffer = Buffer.from('not a PDF');

      const result = await agent.extractTables({ input: invalidBuffer });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generatePdf', () => {
    it('should generate PDF from text', async () => {
      const result = await agent.generatePdf({
        content: [
          { type: 'text', text: 'Hello World' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer?.length).toBeGreaterThan(0);
    });

    it('should generate PDF with title metadata', async () => {
      const result = await agent.generatePdf({
        content: [
          { type: 'text', text: 'Test Document' }
        ],
        options: {
          title: 'Test PDF',
          author: 'Test Author'
        }
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should generate PDF with custom size and layout', async () => {
      const result = await agent.generatePdf({
        content: [
          { type: 'text', text: 'Custom PDF' }
        ],
        options: {
          size: 'Letter',
          layout: 'landscape'
        }
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple content blocks', async () => {
      const result = await agent.generatePdf({
        content: [
          { type: 'text', text: 'First paragraph' },
          { type: 'text', text: 'Second paragraph' },
          { type: 'text', text: 'Third paragraph' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should generate PDF with custom margins', async () => {
      const result = await agent.generatePdf({
        content: [
          { type: 'text', text: 'Text with margins' }
        ],
        options: {
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        }
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty content array', async () => {
      const result = await agent.generatePdf({ content: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain('content');
    });
  });

  describe('mergePdfs', () => {
    it('should merge multiple PDFs', async () => {
      const pdf1 = await createSimplePdf('Document 1');
      const pdf2 = await createSimplePdf('Document 2');

      const result = await agent.mergePdfs({
        pdfs: [pdf1, pdf2]
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle single PDF in merge', async () => {
      const pdf = await createSimplePdf('Single Document');

      const result = await agent.mergePdfs({
        pdfs: [pdf]
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty PDFs array', async () => {
      const result = await agent.mergePdfs({ pdfs: [] });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least one PDF');
    });

    it('should handle invalid PDF in merge', async () => {
      const validPdf = await createSimplePdf('Valid');
      const invalidPdf = Buffer.from('invalid');

      const result = await agent.mergePdfs({
        pdfs: [validPdf, invalidPdf]
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPdfInfo', () => {
    it('should get PDF information', async () => {
      const pdfBuffer = await createSimplePdf('Test Document');

      const result = await agent.getPdfInfo({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.info).toBeDefined();
      expect(result.info?.pages).toBeGreaterThan(0);
    });

    it('should extract metadata if available', async () => {
      const doc = new (PDFDocument as any)({
        info: {
          Title: 'Test PDF',
          Author: 'Test Author',
          Subject: 'Testing'
        }
      });

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.text('Content');
        doc.end();
      });

      const result = await agent.getPdfInfo({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.info?.pages).toBe(1);
    });

    it('should handle invalid PDF', async () => {
      const result = await agent.getPdfInfo({ 
        input: Buffer.from('not a PDF') 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('splitPdf', () => {
    it('should split PDF into individual pages', async () => {
      const doc = new (PDFDocument as any)();
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('Page 1');
        doc.addPage();
        doc.text('Page 2');
        doc.addPage();
        doc.text('Page 3');
        doc.end();
      });

      const result = await agent.splitPdf({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.pages).toBeDefined();
      expect(Array.isArray(result.pages)).toBe(true);
      expect(result.pageCount).toBe(3);
    });

    it('should split PDF with page range', async () => {
      const doc = new (PDFDocument as any)();
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('Page 1');
        doc.addPage();
        doc.text('Page 2');
        doc.addPage();
        doc.text('Page 3');
        doc.end();
      });

      const result = await agent.splitPdf({ 
        input: pdfBuffer,
        pageRange: { start: 1, end: 2 }
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
    });

    it('should handle single page PDF', async () => {
      const pdfBuffer = await createSimplePdf('Single Page');

      const result = await agent.splitPdf({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(1);
      expect(result.pages).toHaveLength(1);
    });

    it('should handle invalid PDF', async () => {
      const result = await agent.splitPdf({ 
        input: Buffer.from('invalid') 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('singleton instance', () => {
    it('should export pdfAgent singleton', () => {
      expect(pdfAgent).toBeInstanceOf(PdfAgent);
    });

    it('should work with singleton instance', async () => {
      const pdfBuffer = await createSimplePdf('Test');

      const result = await pdfAgent.extractText({ input: pdfBuffer });

      expect(result.success).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long text in PDF generation', async () => {
      const longText = 'A'.repeat(10000);
      
      const result = await agent.generatePdf({
        content: [{ type: 'text', text: longText }]
      });

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle special characters in PDF text', async () => {
      const specialText = 'Special: © ® ™ € £ ¥';
      const pdfBuffer = await createSimplePdf(specialText);

      const result = await agent.extractText({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.text).toBeDefined();
    });

    it('should handle malformed metadata gracefully', async () => {
      const pdfBuffer = await createSimplePdf('Test');

      const result = await agent.getPdfInfo({ input: pdfBuffer });

      expect(result.success).toBe(true);
      expect(result.info).toBeDefined();
    });
  });
});
