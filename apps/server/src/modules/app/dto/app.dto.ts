import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiProperty({ description: '应用名称', example: '我的 AI 助手' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '应用描述', example: '用于客服的 AI 助手' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '模型 ID', example: 'qwen-turbo' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ description: '应用配置', example: { temperature: 0.7 } })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateAppDto {
  @ApiPropertyOptional({ description: '应用名称', example: '我的 AI 助手' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '应用描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '模型 ID' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ description: '应用配置' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
