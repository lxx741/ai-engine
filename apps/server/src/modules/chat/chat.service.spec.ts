import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ChatService', () => {
  let chatService: ChatService;
  let conversationService: ConversationService;
  let messageService: MessageService;

  const mockPrismaService = {
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    app: {
      findUnique: jest.fn(),
    },
  };

  const mockConversationService = {
    findOne: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findByApp: jest.fn(),
    getHistory: jest.fn(),
    getMessageCount: jest.fn(),
  };

  const mockMessageService = {
    save: jest.fn(),
    saveBatch: jest.fn(),
    findOne: jest.fn(),
    findByConversation: jest.fn(),
    getHistory: jest.fn(),
    delete: jest.fn(),
    countByConversation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compile();

    chatService = module.get<ChatService>(ChatService);
    conversationService = module.get<ConversationService>(ConversationService);
    messageService = module.get<MessageService>(MessageService);
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
        app: { modelId: 'qwen-turbo' },
      });

      mockMessageService.getHistory.mockResolvedValue([]);
      mockMessageService.save.mockResolvedValue({ id: 'msg-1', role: 'user', content: message });

      const result = await chatService.send(message, conversationId, userId);

      expect(conversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(messageService.getHistory).toHaveBeenCalledWith(conversationId, 10);
      expect(messageService.save).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });

  describe('sendStream', () => {
    it('should stream message chunks', async () => {
      const conversationId = 'test-conversation-id';
      const message = 'Hello';

      mockConversationService.findOne.mockResolvedValue({
        id: conversationId,
        app: { modelId: 'qwen-turbo' },
      });

      mockMessageService.getHistory.mockResolvedValue([]);
      mockMessageService.save.mockResolvedValue({ id: 'msg-1', role: 'user', content: message });

      const stream = chatService.sendStream(message, conversationId);
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(conversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(messageService.save).toHaveBeenCalled();
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
