import { IsString, IsBoolean, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({ description: '模型名称', example: '通义千问' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '提供商', example: 'aliyun', enum: ['aliyun', 'ollama', 'openai'] })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: '模型标识', example: 'qwen-turbo' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional({ description: '模型配置', example: { apiKey: 'sk-xxx' } })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: '是否为默认模型', example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateModelDto {
  @ApiPropertyOptional({ description: '模型名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '提供商' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ description: '模型标识' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: '模型配置' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: '是否为默认模型' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
