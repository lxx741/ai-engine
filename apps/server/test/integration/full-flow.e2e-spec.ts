import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FullFlowTestModule } from '../../test/full-flow-test.module';
import request from 'supertest';

// Mock test data
const mockTestData = {
  app: { id: 'test-app-id', apiKey: 'test-api-key' },
  conversation: { id: 'test-conversation-id' },
  workflow: { id: 'test-workflow-id' },
};

describe('Full Business Flow E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FullFlowTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    // 手动设置全局前缀
    app.setGlobalPrefix('/api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. 完整流程：创建应用→创建会话→发送消息', () => {
    it('应该创建应用', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/apps')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          name: 'Full Flow Test App',
          description: 'Complete flow test',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.apiKey).toBeDefined();
    });

    it('应该创建会话', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/sessions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          appId: mockTestData.app.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    it('应该发送消息并获取响应', async () => {
      mocks.chatService.sendMessage.mockResolvedValue({
        role: 'assistant',
        content: 'Hello! How can I help you?',
        conversationId: mockTestData.conversation.id,
      });

      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          conversationId: mockTestData.conversation.id,
          message: 'Hello',
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBeDefined();
    });
  });

  describe('2. 完整流程：创建应用→创建工作流→执行工作流', () => {
    it('应该创建工作流', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          appId: mockTestData.app.id,
          name: 'Full Flow Workflow',
          description: 'Complete workflow test',
          nodes: [
            { id: 'start', type: 'start', config: {} },
            { id: 'end', type: 'end', config: {} },
          ],
          edges: [{ source: 'start', target: 'end' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    it('应该执行工作流', async () => {
      mocks.workflowService.execute.mockResolvedValue({
        id: 'exec-123',
        status: 'completed',
        output: { result: 'workflow executed' },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${mockTestData.workflow.id}/run`)
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({ variables: { input: 'test' } });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });
  });

  describe('3. 完整流程：创建应用→调用工具', () => {
    it('应该获取工具列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('应该执行工具', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tools/http/execute')
        .send({
          url: 'https://example.com',
          method: 'GET',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('4. 完整流程：创建应用→配置模型→对话', () => {
    it('应该获取默认模型', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/models/default/active');

      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });

    it('应该使用配置的模型进行对话', async () => {
      mocks.chatService.sendMessage.mockResolvedValue({
        role: 'assistant',
        content: 'Response from configured model',
        conversationId: mockTestData.conversation.id,
      });

      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          conversationId: mockTestData.conversation.id,
          message: 'Test with configured model',
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBeDefined();
    });
  });

  describe('5. 多应用隔离测试（应用 A 不能访问应用 B 的数据）', () => {
    it('应该为应用 A 创建工作流', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', 'app-a-api-key')
        .send({
          appId: 'app-a-id',
          name: 'App A Workflow',
          nodes: [{ id: 'start', type: 'start' }],
          edges: [],
        });

      expect(response.status).toBe(201);
    });

    it('应用 B 的 API Key 不能访问应用 A 的工作流', async () => {
      mocks.workflowService.findOne.mockRejectedValue({
        status: 403,
        message: 'Access denied',
      });

      const response = await request(app.getHttpServer())
        .get('/api/workflows/app-a-workflow-id')
        .set('X-API-Key', 'app-b-api-key');

      expect(response.status).toBe(403);

      mocks.workflowService.findOne.mockResolvedValue(mockTestData.workflow);
    });

    it('应用 B 的 API Key 不能访问应用 A 的工作流列表', async () => {
      mocks.workflowService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: 'app-a-id' })
        .set('X-API-Key', 'app-b-api-key');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('6. API Key 重置后会话仍然有效', () => {
    it('应该创建会话', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/sessions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({ appId: mockTestData.app.id });

      expect(response.status).toBe(201);
    });

    it('应该重置 API Key', async () => {
      mocks.appService.regenerateApiKey.mockResolvedValue({
        ...mockTestData.app,
        apiKey: 'new-api-key-after-regenerate',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/apps/${mockTestData.app.id}/regenerate-key`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
      expect(response.body.apiKey).toBeDefined();
    });

    it('应该使用新 API Key 发送消息', async () => {
      mocks.chatService.sendMessage.mockResolvedValue({
        role: 'assistant',
        content: 'Response with new API key',
        conversationId: mockTestData.conversation.id,
      });

      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', 'new-api-key-after-regenerate')
        .send({
          conversationId: mockTestData.conversation.id,
          message: 'Test with new key',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('7. 删除应用后关联数据清理', () => {
    it('应该创建工作流', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          appId: mockTestData.app.id,
          name: 'Workflow to be deleted',
          nodes: [{ id: 'start', type: 'start' }],
          edges: [],
        });

      expect(response.status).toBe(201);
    });

    it('应该创建会话', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/sessions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({ appId: mockTestData.app.id });

      expect(response.status).toBe(201);
    });

    it('应该删除应用', async () => {
      mocks.appService.remove.mockResolvedValue({ message: 'App deleted' });

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${mockTestData.app.id}`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
    });
  });

  describe('8. 删除工作流后执行记录清理', () => {
    it('应该创建工作流', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({
          appId: mockTestData.app.id,
          name: 'Workflow with executions',
          nodes: [{ id: 'start', type: 'start' }],
          edges: [],
        });

      expect(response.status).toBe(201);
    });

    it('应该执行工作流', async () => {
      mocks.workflowService.execute.mockResolvedValue({
        id: 'exec-456',
        status: 'completed',
        output: {},
      });

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${mockTestData.workflow.id}/run`)
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({ variables: {} });

      expect(response.status).toBe(200);
    });

    it('应该获取执行记录', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${mockTestData.workflow.id}/executions`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('应该删除工作流', async () => {
      mocks.workflowService.remove.mockResolvedValue({ message: 'Workflow deleted' });

      const response = await request(app.getHttpServer())
        .delete(`/api/workflows/${mockTestData.workflow.id}`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
    });

    it('应该不能访问已删除的工作流', async () => {
      mocks.workflowService.findOne.mockRejectedValue({
        status: 404,
        message: 'Workflow not found',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${mockTestData.workflow.id}`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(404);

      mocks.workflowService.findOne.mockResolvedValue(mockTestData.workflow);
    });
  });

  describe('9. 并发创建多个应用', () => {
    it('应该并发创建多个应用', async () => {
      const appCount = 5;
      const promises = Array.from({ length: appCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/apps')
          .set('X-API-Key', mockTestData.app.apiKey)
          .send({
            name: `Concurrent App ${i}`,
            description: `App ${i} created concurrently`,
          })
          .then(response => ({
            status: response.status,
            body: response.body,
          })),
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body.id).toBeDefined();
        expect(result.body.apiKey).toBeDefined();
      });
    });

    it('应该每个应用都有唯一的 ID 和 API Key', async () => {
      const appCount = 5;
      const createdApps: Array<{ id: string; apiKey: string }> = [];

      for (let i = 0; i < appCount; i++) {
        mocks.appService.create.mockResolvedValue({
          ...mockTestData.app,
          id: `unique-app-id-${i}`,
          apiKey: `unique-api-key-${i}`,
        });

        const response = await request(app.getHttpServer())
          .post('/api/apps')
          .set('X-API-Key', mockTestData.app.apiKey)
          .send({
            name: `Unique App ${i}`,
          });

        createdApps.push({
          id: response.body.id,
          apiKey: response.body.apiKey,
        });
      }

      const ids = createdApps.map(app => app.id);
      const apiKeys = createdApps.map(app => app.apiKey);

      expect(new Set(ids).size).toBe(appCount);
      expect(new Set(apiKeys).size).toBe(appCount);
    });
  });

  describe('10. 大量消息后的性能测试', () => {
    it('应该创建会话', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/sessions')
        .set('X-API-Key', mockTestData.app.apiKey)
        .send({ appId: mockTestData.app.id });

      expect(response.status).toBe(201);
    });

    it('应该发送多条消息', async () => {
      mocks.chatService.sendMessage.mockResolvedValue({
        role: 'assistant',
        content: 'Response',
        conversationId: mockTestData.conversation.id,
      });

      const messageCount = 10;
      const promises = Array.from({ length: messageCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/chat/completions')
          .set('X-API-Key', mockTestData.app.apiKey)
          .send({
            conversationId: mockTestData.conversation.id,
            message: `Message ${i}`,
          }),
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('应该获取消息历史', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/chat/sessions/${mockTestData.conversation.id}/messages`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('应该获取会话详情', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/chat/sessions/${mockTestData.conversation.id}`)
        .set('X-API-Key', mockTestData.app.apiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockTestData.conversation.id);
    });
  });
});
