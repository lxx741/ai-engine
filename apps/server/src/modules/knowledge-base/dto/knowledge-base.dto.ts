import { IsString, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for RAG configuration
 */
export class RAGConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  chunkSize?: number = 500;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  chunkOverlap?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number = 0.3;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number = 10;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  separators?: string[] = ['\n\n', '\n', '.', '!', '?', ' '];
}

/**
 * DTO for creating a knowledge base
 */
export class CreateKnowledgeBaseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RAGConfigDto)
  config?: RAGConfigDto;
}

/**
 * DTO for updating a knowledge base
 */
export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RAGConfigDto)
  config?: RAGConfigDto;
}

/**
 * DTO for uploading a document
 */
export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for searching in knowledge base
 */
export class SearchKnowledgeBaseDto {
  @IsString()
  query: string;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 10)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  topK?: number = 10;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 0.3)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number = 0.3;
}
