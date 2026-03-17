import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsTestModule } from '../../test/workflows-test.module';
import { mockTestData } from '../utils/mock-factory';
import request from 'supertest';

describe('Workflows API E2E', () => {
  let app: INestApplication;
  let testApiKey: string;
  let testAppId: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    // 手动设置全局前缀
    app.setGlobalPrefix('/api');
    await app.init();

    testAppId = mockTestData.app.id;
    testApiKey = mockTestData.app.apiKey;
    testWorkflowId = mockTestData.workflow.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    testWorkflowId = mockTestData.workflow.id;
  });

  describe('POST /api/workflows', () => {
    it('should create a workflow', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Test Workflow',
          appId: testAppId,
          description: 'Test workflow description',
          nodes: [{ id: 'node1', type: 'start' }],
          edges: [{ from: 'node1', to: 'node2' }],
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Workflow');
      expect(response.body.appId).toBe(testAppId);
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.edges)).toBe(true);
      
      testWorkflowId = response.body.id;
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          appId: testAppId,
          description: 'Missing name field',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when appId is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Workflow without appId',
          description: 'Missing appId field',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when nodes is not an array', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Invalid nodes',
          appId: testAppId,
          nodes: 'not-an-array',
          edges: [],
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when edges is not an array', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Invalid edges',
          appId: testAppId,
          nodes: [],
          edges: 'not-an-array',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/workflows', () => {
    it('should get list of workflows', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId })
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId });

      expect(response.status).toBe(401);
    });

    it('should return 403 with invalid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId })
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('should get workflow details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${testWorkflowId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testWorkflowId);
      expect(response.body.name).toBe(mockTestData.workflow.name);
    });

    it('should return 404 for non-existent workflow', async () => {
      mocks.workflowService.findOne.mockRejectedValue({
        status: 404,
        message: 'Workflow not found',
      });

      const response = await request(app.getHttpServer())
        .get('/api/workflows/non-existent-id')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(404);

      mocks.workflowService.findOne.mockResolvedValue(mockTestData.workflow);
    });
  });

  describe('PATCH /api/workflows/:id', () => {
    it('should update a workflow', async () => {
      mocks.workflowService.update.mockResolvedValue({
        ...mockTestData.workflow,
        name: 'Updated Workflow',
        description: 'Updated description',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/workflows/${testWorkflowId}`)
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Updated Workflow',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Workflow');
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('should delete a workflow', async () => {
      mocks.workflowService.remove.mockResolvedValue({ message: 'Workflow deleted successfully' });

      const response = await request(app.getHttpServer())
        .delete(`/api/workflows/${testWorkflowId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/workflows/:id/run', () => {
    it('should execute a workflow', async () => {
      mocks.workflowService.execute.mockResolvedValue({
        id: 'execution-id-123',
        status: 'completed',
        output: { result: 'workflow output' },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${testWorkflowId}/run`)
        .set('X-API-Key', testApiKey)
        .send({
          variables: { input: 'test input' },
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body.output).toBeDefined();
    });

    it('should execute a workflow with empty variables', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${testWorkflowId}/run`)
        .set('X-API-Key', testApiKey)
        .send({ variables: {} });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });
  });

  describe('GET /api/workflows/:id/executions', () => {
    it('should get workflow execution history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${testWorkflowId}/executions`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Protected Resource Access', () => {
    it('should access protected resource with valid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId })
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
