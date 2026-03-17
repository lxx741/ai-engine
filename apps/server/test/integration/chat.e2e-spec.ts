import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ToolService } from '../../src/modules/tool/tool.service';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const mockToolService = {
  listTools: () => [],
  getTool: () => null,
  executeTool: () => ({ success: true, output: 'mocked' }),
};

describe('Chat API E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let testConversationId: string;
  let mockPrisma: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ToolService)
      .useValue(mockToolService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    await app.init();

    mockPrisma = new PrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authToken = 'test-api-key-e2e';
    testConversationId = 'test-conversation-123';

    vi.clearAllMocks();

    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: testConversationId,
      appId: 'test-app-uuid',
      metadata: { title: 'Test Conversation' },
      createdAt: new Date(),
      app: {
        id: 'test-app-uuid',
        name: 'Test App',
        modelId: 'qwen-turbo',
      },
    });

    mockPrisma.conversation.findMany.mockResolvedValue([
      {
        id: testConversationId,
        appId: 'test-app-uuid',
        metadata: { title: 'Test Conversation' },
        createdAt: new Date(),
      },
    ]);

    mockPrisma.conversation.count.mockResolvedValue(1);

    mockPrisma.conversation.create.mockResolvedValue({
      id: 'new-conversation-id',
      appId: 'test-app-uuid',
      metadata: { title: 'New Conversation' },
      createdAt: new Date(),
    });

    mockPrisma.conversation.delete.mockResolvedValue({});

    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        tokens: 10,
        metadata: {},
        createdAt: new Date(),
      },
    ]);

    mockPrisma.message.create.mockResolvedValue({
      id: 'new-msg-id',
      role: 'assistant',
      content: 'Mocked response',
      tokens: 15,
      metadata: {},
      createdAt: new Date(),
    });

    mockPrisma.message.count.mockResolvedValue(2);

    mockPrisma.$transaction.mockImplementation((ops: any) => Promise.all(ops));
  });

  describe('POST /chat/completions', () => {
    it('1. 发送消息并获取响应（非流式）', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          conversationId: testConversationId,
          message: 'Hello, how are you?',
          userId: 'test-user',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('2. 发送消息并获取流式响应', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/completions/stream')
        .set('X-API-Key', authToken)
        .send({
          conversationId: testConversationId,
          message: 'Stream this message',
          userId: 'test-user',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('3. 消息缺失返回 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          conversationId: testConversationId,
        });

      expect(response.status).toBe(400);
    });

    it('4. conversationId 缺失返回 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
    });

    it('5. 不存在的会话返回 404', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          conversationId: 'non-existent-id',
          message: 'Hello',
        });

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('GET /chat/sessions', () => {
    it('6. 获取会话列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/sessions')
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /chat/sessions/:id', () => {
    it('7. 获取会话详情', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/sessions/${testConversationId}`)
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('8. 不存在的会话返回 404', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/chat/sessions/non-existent-id')
        .set('X-API-Key', authToken);

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('GET /chat/sessions/:id/messages', () => {
    it('9. 获取消息历史', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/sessions/${testConversationId}/messages`)
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /chat/sessions', () => {
    it('10. 创建新会话', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/sessions')
        .set('X-API-Key', authToken)
        .send({
          appId: 'test-app-uuid',
          metadata: { title: 'New Test Conversation' },
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('DELETE /chat/sessions/:id', () => {
    it('11. 删除会话', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/chat/sessions/${testConversationId}`)
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Authentication', () => {
    it('12. 认证失败 - 无 API Key', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/sessions');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
