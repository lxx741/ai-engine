import { NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ConversationService', () => {
  let conversationService: ConversationService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      $transaction: vi.fn(async (operations: any[]) => {
        const results = [];
        for (const op of operations) {
          results.push(await op);
        }
        return results;
      }),
      conversation: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    };

    // 直接实例化服务，传入 mock 的 PrismaService
    conversationService = new ConversationService(mockPrismaService as PrismaService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(conversationService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new conversation', async () => {
      const createDto = {
        appId: 'app-123',
        metadata: { title: 'Test Conversation' },
      };

      mockPrismaService.conversation.create.mockResolvedValue({
        id: 'conv-123',
        appId: createDto.appId,
        metadata: createDto.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await conversationService.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('conv-123');
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findOne', () => {
    it('should return a conversation', async () => {
      const conversation = {
        id: 'conv-123',
        appId: 'app-123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        app: { id: 'app-123', modelId: 'qwen-turbo' },
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(conversation);

      const result = await conversationService.findOne('conv-123');

      expect(result).toEqual(conversation);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(conversationService.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByApp', () => {
    it('should return paginated conversations', async () => {
      const conversations = [
        { id: 'conv-1', appId: 'app-123', createdAt: new Date(), updatedAt: new Date() },
        { id: 'conv-2', appId: 'app-123', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.conversation.findMany.mockResolvedValue(conversations);
      mockPrismaService.conversation.count.mockResolvedValue(2);

      const result = await conversationService.findByApp('app-123', 1, 20);

      expect(result.data).toEqual(conversations);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('delete', () => {
    it('should delete a conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        appId: 'app-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.conversation.delete.mockResolvedValue({});

      const result = await conversationService.delete('conv-123');

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
      });
    });
  });

  describe('getHistory', () => {
    it('should return conversation history', async () => {
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', createdAt: new Date(), updatedAt: new Date() },
        { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await conversationService.getHistory('conv-123', 10);

      expect(result).toEqual(messages);
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });
});
