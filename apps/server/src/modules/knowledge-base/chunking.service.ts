import { Injectable, Logger } from '@nestjs/common';
import { RAGConfig, DEFAULT_RAG_CONFIG, FileTypeRAGConfig, FILE_TYPE_RAG_CONFIG } from '@ai-engine/shared';

/**
 * Service for text chunking strategies
 */
@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  /**
   * Chunk text according to configuration
   * @param text - Text to chunk
   * @param config - RAG configuration
   * @param fileType - Optional file type for specific config
   * @returns Array of text chunks
   */
  chunkText(text: string, config: RAGConfig = DEFAULT_RAG_CONFIG, fileType?: string): string[] {
    // Get file-type specific config if available
    const fileConfig = fileType ? FILE_TYPE_RAG_CONFIG[fileType.toLowerCase()] : undefined;
    const effectiveConfig = {
      ...config,
      ...fileConfig,
    };

    this.logger.debug(`Chunking text with config: ${JSON.stringify(effectiveConfig)}`);

    // Use recursive character-based chunking
    return this.recursiveChunk(
      text,
      effectiveConfig.separators,
      effectiveConfig.chunkSize,
      effectiveConfig.chunkOverlap,
    );
  }

  /**
   * Recursive chunking by separators
   * @param text - Text to chunk
   * @param separators - Separators in priority order
   * @param chunkSize - Target chunk size
   * @param chunkOverlap - Overlap between chunks
   * @returns Array of chunks
   */
  private recursiveChunk(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    // Base case: if text is shorter than chunk size, return as is
    if (text.length <= chunkSize) {
      return [text];
    }

    // Try to split by each separator
    for (const separator of separators) {
      const chunks = this.splitBySeparator(text, separator, chunkSize, chunkOverlap);
      if (chunks.length > 0 && chunks.every(chunk => chunk.length <= chunkSize)) {
        return chunks;
      }
    }

    // Fallback: split by character count
    return this.splitBySize(text, chunkSize, chunkOverlap);
  }

  /**
   * Split text by separator while respecting chunk size
   */
  private splitBySeparator(
    text: string,
    separator: string,
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const parts = text.split(separator);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const part of parts) {
      const combined = currentChunk ? currentChunk + separator + part : part;

      if (combined.length <= chunkSize) {
        currentChunk = combined;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = part;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Apply overlap
    return this.applyOverlap(chunks, chunkOverlap);
  }

  /**
   * Split text by fixed size
   */
  private splitBySize(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - chunkOverlap;
    }

    return chunks;
  }

  /**
   * Apply overlap between chunks
   */
  private applyOverlap(chunks: string[], chunkOverlap: number): string[] {
    if (chunkOverlap === 0 || chunks.length <= 1) {
      return chunks;
    }

    const result: string[] = [];
    let previousChunk = '';

    for (const chunk of chunks) {
      if (previousChunk) {
        // Add overlap from previous chunk
        const overlap = previousChunk.slice(-chunkOverlap);
        const combined = overlap + chunk;
        result.push(combined);
      } else {
        result.push(chunk);
      }
      previousChunk = chunk;
    }

    return result;
  }

  /**
   * Estimate number of tokens in text (rough approximation)
   * English: ~1 token = 4 characters
   * Chinese: ~1 token = 1-2 characters
   */
  estimateTokenCount(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishChars = text.length - chineseChars;
    
    return Math.ceil(chineseChars * 0.8 + englishChars * 0.25);
  }
}
