import { NotFoundException } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../../prisma/prisma.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MessageService', () => {
  let messageService: MessageService;
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
      message: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    };

    // 直接实例化服务，传入 mock 的 PrismaService
    messageService = new MessageService(mockPrismaService as PrismaService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  describe('save', () => {
    it('should save a single message', async () => {
      const messageData = {
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello',
        tokens: 10,
      };

      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-123',
        ...messageData,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await messageService.save(messageData);

      expect(result).toBeDefined();
      expect(result.id).toBe('msg-123');
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: messageData.conversationId,
          role: messageData.role,
          content: messageData.content,
          tokens: messageData.tokens,
          metadata: {},
        },
      });
    });
  });

  describe('saveBatch', () => {
    it('should save multiple messages using transaction', async () => {
      const messages = [
        { conversationId: 'conv-123', role: 'user', content: 'Hello' },
        { conversationId: 'conv-123', role: 'assistant', content: 'Hi' },
      ];

      mockPrismaService.message.create
        .mockResolvedValueOnce({ id: 'msg-1', ...messages[0], metadata: {}, createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce({ id: 'msg-2', ...messages[1], metadata: {}, createdAt: new Date(), updatedAt: new Date() });

      const result = await messageService.saveBatch(messages);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should return empty array when no messages provided', async () => {
      const result = await messageService.saveBatch([]);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a message', async () => {
      const message = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.message.findUnique.mockResolvedValue(message);

      const result = await messageService.findOne('msg-123');

      expect(result).toEqual(message);
    });

    it('should throw NotFoundException when message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(messageService.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByConversation', () => {
    it('should return messages for a conversation', async () => {
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', createdAt: new Date(), updatedAt: new Date() },
        { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await messageService.findByConversation('conv-123', 50, 0);

      expect(result).toEqual(messages);
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
        orderBy: { createdAt: 'asc' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getHistory', () => {
    it('should return message history in correct order', async () => {
      // 按 createdAt desc 排序后返回，然后 reverse() 变成 asc
      const messagesFromDb = [
        { id: 'msg-2', role: 'assistant', content: 'Hi', createdAt: new Date('2024-01-02'), updatedAt: new Date() },
        { id: 'msg-1', role: 'user', content: 'Hello', createdAt: new Date('2024-01-01'), updatedAt: new Date() },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(messagesFromDb);

      const result = await messageService.getHistory('conv-123', 10);

      // reverse() 后，msg-1 应该在前面
      expect(result[0].id).toBe('msg-1');
      expect(result[1].id).toBe('msg-2');
    });
  });

  describe('delete', () => {
    it('should delete a message', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue({
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.message.delete.mockResolvedValue({});

      const result = await messageService.delete('msg-123');

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
      });
    });
  });

  describe('countByConversation', () => {
    it('should return message count', async () => {
      mockPrismaService.message.count.mockResolvedValue(5);

      const result = await messageService.countByConversation('conv-123');

      expect(result).toBe(5);
      expect(mockPrismaService.message.count).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
      });
    });
  });
});
