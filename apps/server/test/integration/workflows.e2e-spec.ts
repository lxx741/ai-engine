import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsTestModule, MOCK_WORKFLOW_SERVICE, MockWorkflowService } from '../../test/workflows-test.module';
import { mockTestData } from '../utils/mock-factory';
import request from 'supertest';
import { vi } from 'vitest';

describe('Workflows API E2E', () => {
  let app: INestApplication;
  let testApiKey: string;
  let testAppId: string;
  let testWorkflowId: string;
  let mockService: MockWorkflowService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsTestModule],
    }).compile();

    mockService = moduleFixture.get<MockWorkflowService>(MOCK_WORKFLOW_SERVICE);
    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
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
    vi.clearAllMocks();
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
      expect(response.body.definition).toBeDefined();
      
      testWorkflowId = response.body.id;
    });

    it('should create workflow without description', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Workflow without description',
          appId: testAppId,
          nodes: [{ id: 'start', type: 'start' }],
          edges: [],
        });

      expect(response.status).toBe(201);
    });

    it('should create workflow with empty nodes and edges', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Simple workflow',
          appId: testAppId,
          nodes: [],
          edges: [],
        });

      expect(response.status).toBe(201);
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

    it('should get list without API key (no auth in test module)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId });

      expect(response.status).toBe(200);
    });

    it('should get list with any API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/workflows')
        .query({ appId: testAppId })
        .set('X-API-Key', 'any-key');

      expect(response.status).toBe(200);
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

    it('should get workflow details by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/workflows/${testWorkflowId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });
  });

  describe('PATCH /api/workflows/:id', () => {
    it('should update a workflow', async () => {
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
      const response = await request(app.getHttpServer())
        .delete(`/api/workflows/${testWorkflowId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/workflows/:id/run', () => {
    it('should execute a workflow', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${testWorkflowId}/run`)
        .set('X-API-Key', testApiKey)
        .send({
          variables: { input: 'test input' },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('completed');
      expect(response.body.output).toBeDefined();
    });

    it('should execute a workflow with empty variables', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${testWorkflowId}/run`)
        .set('X-API-Key', testApiKey)
        .send({ variables: {} });

      expect(response.status).toBe(201);
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
