import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for generating embeddings using Ollama
 */
@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private readonly ollamaUrl: string;
  private readonly embeddingModel: string;

  constructor(private configService: ConfigService) {
    this.ollamaUrl = this.configService.get('OLLAMA_URL', 'http://localhost:11434');
    this.embeddingModel = this.configService.get('OLLAMA_EMBEDDING_MODEL', 'mxbai-embed-large');
  }

  /**
   * Generate embedding for a text
   * @param text - Text to embed
   * @returns Vector embedding as number array
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Ollama API error: ${error}`);
        throw new Error(`Failed to generate embedding: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param texts - Array of texts to embed
   * @returns Array of vector embeddings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid overwhelming Ollama
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Similarity score (0-1)
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
