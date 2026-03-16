import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { PrismaService } from '../../prisma/prisma.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 必须在 vi.mock 之前定义 mock 对象
const mockProvider = {
  name: 'aliyun',
  chat: vi.fn(),
  chatComplete: vi.fn(),
};

// Mock @ai-engine/providers - 必须在 import 之前
vi.mock('@ai-engine/providers', async () => {
  const actual = await vi.importActual('@ai-engine/providers');
  return {
    ...actual,
    getProviderFactory: vi.fn(() => ({
      getProviderForModel: vi.fn(() => mockProvider),
      getModelName: vi.fn(() => 'qwen-turbo'),
      createModelConfig: vi.fn(() => ({ apiKey: 'test-key' })),
      healthCheck: vi.fn(),
      healthCheckAll: vi.fn(),
    })),
  };
});

describe('ChatService', () => {
  let chatService: ChatService;
  let mockPrismaService: any;
  let mockConversationService: any;
  let mockMessageService: any;

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
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      conversation: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      app: {
        findUnique: vi.fn(),
      },
    };

    mockConversationService = {
      findOne: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findByApp: vi.fn(),
      getHistory: vi.fn(),
      getMessageCount: vi.fn(),
    };

    mockMessageService = {
      save: vi.fn(),
      saveBatch: vi.fn(),
      findOne: vi.fn(),
      findByConversation: vi.fn(),
      getHistory: vi.fn(),
      delete: vi.fn(),
      countByConversation: vi.fn(),
    };

    // 直接实例化服务，传入 mock 的依赖
    chatService = new ChatService(
      mockPrismaService as PrismaService,
      mockConversationService as ConversationService,
      mockMessageService as MessageService,
    );
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(chatService).toBeDefined();
  });

  describe('send', () => {
    it('should send a message and return response', async () => {
      const conversationId = 'test-conversation-id';
      const message = 'Hello';
      const userId = 'test-user-id';

      mockConversationService.findOne.mockResolvedValue({
        id: conversationId,
        app: { id: 'app-1', modelId: 'qwen-turbo' },
      });

      mockMessageService.getHistory.mockResolvedValue([]);
      mockMessageService.save
        .mockResolvedValueOnce({ id: 'msg-1', role: 'user', content: message })
        .mockResolvedValueOnce({ id: 'msg-2', role: 'assistant', content: 'Hi there' });

      // Mock provider response
      mockProvider.chatComplete.mockResolvedValue({
        content: 'Hi there',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });

      const result = await chatService.send(message, conversationId, userId);

      expect(mockConversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(mockMessageService.getHistory).toHaveBeenCalledWith(conversationId, 10);
      expect(mockMessageService.save).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result.content).toBe('Hi there');
    });
  });

  describe('sendStream', () => {
    it('should stream message chunks', async () => {
      const conversationId = 'test-conversation-id';
      const message = 'Hello';

      mockConversationService.findOne.mockResolvedValue({
        id: conversationId,
        app: { id: 'app-1', modelId: 'qwen-turbo' },
      });

      mockMessageService.getHistory.mockResolvedValue([]);
      mockMessageService.save.mockResolvedValue({ id: 'msg-1', role: 'user', content: message });

      // Mock provider stream - return an async generator
      async function* mockStream() {
        yield { content: 'Hi ', finishReason: null };
        yield { content: 'there', finishReason: 'stop' };
        yield { content: '', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } };
      }

      mockProvider.chat.mockReturnValue(mockStream());

      const stream = chatService.sendStream(message, conversationId);
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(mockConversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(mockMessageService.save).toHaveBeenCalled();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('calculateTokens', () => {
    it('should calculate token count for messages', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there' },
      ];

      const result = await chatService.calculateTokens(messages);

      expect(result.promptTokens).toBeGreaterThan(0);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });
});
