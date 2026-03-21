import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from './vector.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto, SearchKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { DEFAULT_RAG_CONFIG } from '@ai-engine/shared';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private vectorService: VectorService,
  ) {}

  /**
   * Create a knowledge base
   */
  async create(appId: string, dto: CreateKnowledgeBaseDto) {
    this.logger.log(`Creating knowledge base for app ${appId}`);

    // Check if app already has a knowledge base
    const existing = await this.prisma.knowledgeBase.findUnique({
      where: { appId },
    });

    if (existing) {
      throw new BadRequestException('App already has a knowledge base');
    }

    const config = {
      ...DEFAULT_RAG_CONFIG,
      ...dto.config,
    };

    return this.prisma.knowledgeBase.create({
      data: {
        appId,
        name: dto.name,
        description: dto.description,
        config,
      },
    });
  }

  /**
   * Get all knowledge bases
   */
  async findAll() {
    return this.prisma.knowledgeBase.findMany({
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get knowledge base by app ID
   */
  async findByAppId(appId: string) {
    return this.prisma.knowledgeBase.findUnique({
      where: { appId },
      include: {
        documents: {
          select: {
            id: true,
            name: true,
            fileType: true,
            fileSize: true,
            chunkCount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  /**
   * Update knowledge base
   */
  async update(id: string, dto: UpdateKnowledgeBaseDto) {
    this.logger.log(`Updating knowledge base ${id}`);

    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!kb) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }

    const config = {
      ...(kb.config as any),
      ...dto.config,
    };

    return this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        config,
      },
    });
  }

  /**
   * Delete knowledge base
   */
  async delete(id: string) {
    this.logger.log(`Deleting knowledge base ${id}`);

    return this.prisma.knowledgeBase.delete({
      where: { id },
    });
  }

  /**
   * Search in knowledge base
   */
  async search(knowledgeBaseId: string, dto: SearchKnowledgeBaseDto) {
    this.logger.log(`Searching KB ${knowledgeBaseId} for: ${dto.query}`);

    // Generate query embedding
    const queryEmbedding = await this.vectorService.generateEmbedding(dto.query);

    // Get all chunks for this knowledge base
    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        document: {
          knowledgeBaseId,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            fileType: true,
          },
        },
      },
    });

    this.logger.log(`Found ${chunks.length} chunks to search`);

    // Calculate cosine similarity in memory
    const results = chunks
      .map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        score: this.cosineSimilarity(chunk.embedding as number[] || [], queryEmbedding),
        document: chunk.document,
        metadata: chunk.metadata,
      }))
      .filter((r) => r.score >= (dto.threshold || DEFAULT_RAG_CONFIG.similarityThreshold))
      .sort((a, b) => b.score - a.score)
      .slice(0, dto.topK || 10);

    this.logger.log(`Found ${results.length} relevant chunks after filtering`);

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length === 0 || vec2.length === 0) return 0;
    if (vec1.length !== vec2.length) {
      this.logger.warn(`Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`);
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(knowledgeBaseId: string) {
    const stats = await this.prisma.document.aggregate({
      where: { knowledgeBaseId },
      _sum: { fileSize: true },
      _count: true,
    });

    const chunkStats = await this.prisma.documentChunk.aggregate({
      where: {
        document: {
          knowledgeBaseId,
        },
      },
      _count: true,
    });

    return {
      documentCount: stats._count,
      totalChunks: chunkStats._count,
      totalSize: stats._sum.fileSize || 0,
      sizeFormatted: this.formatBytes(stats._sum.fileSize || 0),
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
