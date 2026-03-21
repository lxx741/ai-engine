import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { DocumentService } from './document.service';
import { VectorService } from './vector.service';
import { ChunkingService } from './chunking.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    DocumentService,
    VectorService,
    ChunkingService,
  ],
  exports: [
    KnowledgeBaseService,
    DocumentService,
    VectorService,
    ChunkingService,
  ],
})
export class KnowledgeBaseModule {}
