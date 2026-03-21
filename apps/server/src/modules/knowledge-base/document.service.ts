import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from './vector.service';
import { ChunkingService } from './chunking.service';
import { FileParser } from './utils/file-parser';
import { UploadDocumentDto } from './dto/knowledge-base.dto';
import { FILE_SIZE_LIMITS } from '@ai-engine/shared';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private vectorService: VectorService,
    private chunkingService: ChunkingService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
  }

  /**
   * Upload and process a document
   */
  async upload(
    knowledgeBaseId: string,
    file: UploadedFile,
    dto: UploadDocumentDto,
  ) {
    this.logger.log(`Uploading document to KB ${knowledgeBaseId}`);

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.singleFile) {
      throw new BadRequestException(
        `File size exceeds limit (${FILE_SIZE_LIMITS.singleFile / 1024 / 1024}MB)`,
      );
    }

    // Check knowledge base quota
    await this.checkQuota(knowledgeBaseId, file.size);

    // Get file type
    const fileType = file.originalname.slice(file.originalname.lastIndexOf('.') + 1).toLowerCase();
    if (!['txt', 'json', 'csv', 'pdf', 'docx'].includes(fileType)) {
      throw new BadRequestException(`Unsupported file type: ${fileType}`);
    }

    // Parse file content
    const content = await FileParser.parse(file.buffer, fileType, true);

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        knowledgeBaseId,
        name: dto.name || file.originalname,
        originalName: file.originalname,
        fileType,
        fileSize: file.size,
        filePath: `/uploads/${knowledgeBaseId}/${file.originalname}`,
        content,
        status: 'processing',
      },
    });

    this.logger.log(`Document ${document.id} created, starting chunking...`);

    // Process document asynchronously
    this.processDocument(document.id, content).catch(error => {
      this.logger.error(`Failed to process document ${document.id}: ${error.message}`);
      this.prisma.document.update({
        where: { id: document.id },
        data: { status: 'failed' },
      }).catch();
    });

    return document;
  }

  /**
   * Process document: chunk and generate embeddings
   */
  private async processDocument(documentId: string, content: string) {
    try {
      // Get document with knowledge base config
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          knowledgeBase: true,
        },
      });

      if (!document) {
        throw new NotFoundException(`Document ${documentId} not found`);
      }

      const config = document.knowledgeBase.config as any;

      // Chunk the content
      const chunks = this.chunkingService.chunkText(
        content,
        config,
        document.fileType,
      );

      this.logger.log(`Created ${chunks.length} chunks for document ${documentId}`);

      // Generate embeddings and save chunks
      const chunkRecords = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.vectorService.generateEmbedding(chunks[i]);
        
        chunkRecords.push({
          documentId,
          chunkIndex: i,
          content: chunks[i],
          embedding,
        });
      }

      // Bulk insert chunks
      if (chunkRecords.length > 0) {
        await this.prisma.documentChunk.createMany({
          data: chunkRecords,
        });
      }

      // Update document status
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          chunkCount: chunks.length,
          status: 'completed',
        },
      });

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check knowledge base quota
   */
  private async checkQuota(knowledgeBaseId: string, fileSize: number) {
    // Get current usage
    const usage = await this.prisma.document.aggregate({
      where: { knowledgeBaseId },
      _sum: { fileSize: true },
      _count: true,
    });

    const currentSize = usage._sum.fileSize || 0;
    const fileCount = usage._count;

    // Check file count limit
    if (fileCount >= FILE_SIZE_LIMITS.maxFilesPerKB) {
      throw new BadRequestException(
        `Maximum file count reached (${FILE_SIZE_LIMITS.maxFilesPerKB})`,
      );
    }

    // Check size limit (500MB default, can expand to 1GB)
    const sizeLimit = FILE_SIZE_LIMITS.singleKB;
    if (currentSize + fileSize > sizeLimit) {
      throw new BadRequestException(
        `Knowledge base size limit exceeded. Current: ${this.formatBytes(currentSize)}, ` +
        `Adding: ${this.formatBytes(fileSize)}, Limit: ${this.formatBytes(sizeLimit)}`,
      );
    }
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

  /**
   * Get document by ID
   */
  async findById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            content: true,
            metadata: true,
          },
        },
      },
    });
  }

  /**
   * Get all documents for a knowledge base
   */
  async findByKnowledgeBase(knowledgeBaseId: string) {
    return this.prisma.document.findMany({
      where: { knowledgeBaseId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        chunkCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a document
   */
  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
