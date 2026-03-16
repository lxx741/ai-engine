import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  MessageEvent,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationDto,
  ChatMessageDto,
  StreamChunkDto,
} from './dto/chat.dto';

@ApiTags('Chat API')
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: '创建新会话', description: '创建一个新的对话会话' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: '会话创建成功',
    type: ConversationDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationDto> {
    try {
      return await this.conversationService.create(createConversationDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('创建会话失败');
    }
  }

  @Get('sessions')
  @ApiOperation({ summary: '会话列表', description: '获取所有会话列表（支持分页）' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: '会话列表获取成功',
  })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async getConversations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
      return await this.conversationService.findAll(pageNum, pageSizeNum);
    } catch (error) {
      console.error('Get conversations error:', error);
      throw new InternalServerErrorException('获取会话列表失败', error.message);
    }
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '会话详情', description: '获取指定会话的详细信息' })
  @ApiParam({ name: 'id', description: '会话 ID', example: 'conversation-id' })
  @ApiResponse({
    status: 200,
    description: '会话详情获取成功',
    type: ConversationDto,
  })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async getConversation(
    @Param('id') id: string,
  ): Promise<ConversationDto> {
    try {
      const conversation = await this.conversationService.findOne(id);
      if (!conversation) {
        throw new NotFoundException(`会话 "${id}" 不存在`);
      }
      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取会话详情失败');
    }
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: '消息历史', description: '获取指定会话的消息历史记录' })
  @ApiParam({ name: 'id', description: '会话 ID', example: 'conversation-id' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: '消息历史获取成功',
    type: [ChatMessageDto],
  })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async getConversationMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<ChatMessageDto[]> {
    try {
      const limitNum = limit ?? 50;
      console.log('Getting messages for conversation:', id, 'limit:', limitNum);
      const conversation = await this.conversationService.findOne(id);
      if (!conversation) {
        throw new NotFoundException(`会话 "${id}" 不存在`);
      }

      const messages = await this.conversationService.getHistory(id, limitNum);
      console.log('Found messages:', messages.length);
      return messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        tokens: msg.tokens,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error('Get conversation messages error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取消息历史失败', error.message);
    }
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '删除会话', description: '删除指定的对话会话' })
  @ApiParam({ name: 'id', description: '会话 ID', example: 'conversation-id' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async deleteConversation(@Param('id') id: string) {
    try {
      const conversation = await this.conversationService.findOne(id);
      if (!conversation) {
        throw new NotFoundException(`会话 "${id}" 不存在`);
      }
      return await this.conversationService.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('删除会话失败');
    }
  }

  @Post('completions')
  @ApiOperation({ summary: '发送消息（非流式）', description: '发送消息并获取完整的 AI 响应' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: '消息发送成功',
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async sendCompletion(
    @Body() sendMessageDto: SendMessageDto,
  ) {
    try {
      if (!sendMessageDto.conversationId) {
        throw new BadRequestException('conversationId 是必填参数');
      }
      if (!sendMessageDto.message) {
        throw new BadRequestException('message 是必填参数');
      }

      const conversation = await this.conversationService.findOne(
        sendMessageDto.conversationId,
      );
      if (!conversation) {
        throw new NotFoundException(
          `会话 "${sendMessageDto.conversationId}" 不存在`,
        );
      }

      return await this.chatService.send(
        sendMessageDto.message,
        sendMessageDto.conversationId,
        sendMessageDto.userId,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('发送消息失败');
    }
  }

  @Post('completions/stream')
  @ApiOperation({ summary: '发送消息（流式）', description: '发送消息并通过流式接收 AI 响应' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: '流式响应成功',
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  @ApiResponse({ status: 403, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async streamCompletion(
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ) {
    if (!sendMessageDto?.conversationId) {
      throw new BadRequestException('conversationId 是必填参数');
    }
    if (!sendMessageDto?.message) {
      throw new BadRequestException('message 是必填参数');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = this.chatService.sendStream(
      sendMessageDto.message,
      sendMessageDto.conversationId,
      sendMessageDto.userId,
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.finishReason === 'stop') {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        break;
      }
    }

    res.end();
  }
}
