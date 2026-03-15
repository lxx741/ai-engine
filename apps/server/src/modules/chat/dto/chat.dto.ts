import { IsString, IsOptional, IsObject, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: '应用 ID', example: 'app-uuid' })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiPropertyOptional({ description: '会话元数据', example: { title: '新对话' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendMessageDto {
  @ApiProperty({ description: '会话 ID', example: 'conversation-uuid' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: '消息内容', example: '你好，请帮我解答一个问题' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: '用户 ID', example: 'user-uuid' })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class ChatMessageDto {
  @ApiProperty({ description: '消息 ID' })
  id: string;

  @ApiProperty({ description: '消息角色', enum: ['user', 'assistant', 'system'] })
  role: string;

  @ApiProperty({ description: '消息内容' })
  content: string;

  @ApiPropertyOptional({ description: '使用的 token 数' })
  tokens?: number;

  @ApiPropertyOptional({ description: '元数据' })
  metadata?: any;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class StreamChunkDto {
  @ApiProperty({ description: 'Chunk 内容' })
  content: string;

  @ApiPropertyOptional({ description: '结束原因', example: 'stop' })
  finishReason?: string;

  @ApiPropertyOptional({ description: '使用统计' })
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ConversationDto {
  @ApiProperty({ description: '会话 ID' })
  id: string;

  @ApiProperty({ description: '应用 ID' })
  appId: string;

  @ApiPropertyOptional({ description: '会话元数据' })
  metadata?: any;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class CreateMessageDto {
  @ApiProperty({ description: '会话 ID' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: '消息角色', enum: ['user', 'assistant', 'system'] })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '使用的 token 数' })
  @IsInt()
  @Min(0)
  @IsOptional()
  tokens?: number;

  @ApiPropertyOptional({ description: '元数据' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
