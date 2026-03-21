import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { KnowledgeBaseService } from './knowledge-base.service';
import { DocumentService } from './document.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto, UploadDocumentDto, SearchKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { FILE_SIZE_LIMITS } from '@ai-engine/shared';

@Controller('knowledge-bases')
export class KnowledgeBaseController {
  constructor(
    private kbService: KnowledgeBaseService,
    private docService: DocumentService,
  ) {}

  /**
   * Create a knowledge base
   */
  @Post()
  async create(
    @Body() dto: CreateKnowledgeBaseDto,
    @Query('appId') appId: string,
  ) {
    if (!appId) {
      throw new Error('appId is required');
    }
    return this.kbService.create(appId, dto);
  }

  /**
   * Get all knowledge bases
   */
  @Get()
  async findAll() {
    return this.kbService.findAll();
  }

  /**
   * Get knowledge base by app ID
   */
  @Get('by-app/:appId')
  async findByAppId(@Param('appId') appId: string) {
    return this.kbService.findByAppId(appId);
  }

  /**
   * Get knowledge base by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.kbService.findByAppId(id);
  }

  /**
   * Update knowledge base
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
  ) {
    return this.kbService.update(id, dto);
  }

  /**
   * Delete knowledge base
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.kbService.delete(id);
  }

  /**
   * Get knowledge base statistics
   */
  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.kbService.getStats(id);
  }

  /**
   * Search in knowledge base
   */
  @Get(':id/search')
  async search(
    @Param('id') id: string,
    @Query() dto: SearchKnowledgeBaseDto,
  ) {
    return this.kbService.search(id, dto);
  }

  /**
   * Get all documents in knowledge base
   */
  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return this.docService.findByKnowledgeBase(id);
  }

  /**
   * Upload a document
   */
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FILE_SIZE_LIMITS.singleFile }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.docService.upload(id, file, dto);
  }

  /**
   * Get document by ID
   */
  @Get(':id/documents/:docId')
  async getDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    return this.docService.findById(docId);
  }

  /**
   * Delete a document
   */
  @Delete(':id/documents/:docId')
  async deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    return this.docService.delete(docId);
  }
}
