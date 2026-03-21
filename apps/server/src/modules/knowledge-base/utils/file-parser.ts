import { Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { parse } from 'csv-parse/sync';
import Tesseract from 'tesseract.js';

/**
 * File parser for different document formats
 */
export class FileParser {
  private static readonly logger = new Logger(FileParser.name);

  /**
   * Parse file buffer to text based on file type
   * @param buffer - File buffer
   * @param fileType - File extension (pdf, docx, txt, json, csv)
   * @param enableOCR - Enable OCR for scanned documents
   * @returns Parsed text content
   */
  static async parse(
    buffer: Buffer,
    fileType: string,
    enableOCR: boolean = false,
  ): Promise<string> {
    const ext = fileType.toLowerCase().replace('.', '');

    this.logger.debug(`Parsing file with type: ${ext}, OCR: ${enableOCR}`);

    switch (ext) {
      case 'txt':
        return this.parseTxt(buffer);
      case 'json':
        return this.parseJson(buffer);
      case 'csv':
        return this.parseCsv(buffer);
      case 'pdf':
        return await this.parsePdf(buffer, enableOCR);
      case 'docx':
        return await this.parseDocx(buffer);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Parse plain text file
   */
  private static parseTxt(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }

  /**
   * Parse JSON file (stringify for embedding)
   */
  private static parseJson(buffer: Buffer): string {
    const content = buffer.toString('utf-8');
    try {
      const json = JSON.parse(content);
      // Convert JSON to readable text
      return this.jsonToText(json);
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Convert JSON object to readable text
   */
  private static jsonToText(obj: any, indent = 0): string {
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }

    const lines: string[] = [];
    const prefix = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      for (const item of obj) {
        lines.push(`${prefix}- ${this.jsonToText(item, indent + 1)}`);
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        lines.push(`${prefix}${key}: ${this.jsonToText(value, indent + 1)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Parse CSV file
   */
  private static parseCsv(buffer: Buffer): string {
    const content = buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    const lines: string[] = [];
    for (const record of records) {
      const line = Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Parse PDF file
   * Note: PDF parsing requires additional setup due to ESM/CJS compatibility
   * Currently returns a placeholder message
   */
  private static async parsePdf(buffer: Buffer, enableOCR: boolean): Promise<string> {
    this.logger.warn('PDF parsing not yet fully implemented. Please convert PDF to text first.');
    
    // Placeholder - in production, use a proper PDF parsing library
    // Options:
    // 1. Use pdfjs-dist (Mozilla's PDF.js)
    // 2. Use a microservice for PDF conversion
    // 3. Use command-line tool (pdftotext)
    
    return '[PDF content - parsing not available]';
  }

  /**
   * Extract text from PDF using OCR
   * Note: This is a simplified version - full OCR would require PDF to image conversion
   */
  private static async ocrFromPdf(buffer: Buffer): Promise<string> {
    try {
      // For now, return empty string
      // Full implementation would require:
      // 1. PDF to image conversion (pdf2pic or similar)
      // 2. Tesseract OCR on each page
      this.logger.warn('OCR for PDF requires additional setup. Returning empty text.');
      return '';
    } catch (error) {
      this.logger.error(`OCR error: ${error instanceof Error ? error.message : error}`);
      return '';
    }
  }

  /**
   * Parse DOCX file
   */
  private static async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages.length > 0) {
        this.logger.debug(`DOCX parsing messages: ${JSON.stringify(result.messages)}`);
      }

      return result.value.trim();
    } catch (error) {
      this.logger.error(`DOCX parsing error: ${error instanceof Error ? error.message : error}`);
      throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get supported file types
   */
  static getSupportedTypes(): string[] {
    return ['.txt', '.json', '.csv', '.pdf', '.docx'];
  }

  /**
   * Validate file type
   */
  static isValidType(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return this.getSupportedTypes().includes(ext);
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    return ext;
  }
}
