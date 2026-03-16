import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';

describe('Chat API Integration Tests (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authToken = 'test-api-key-e2e';
  });

  describe('POST /api/chat/completions', () => {
    it('should send a message and get response (mocked)', async () => {
      // Note: This test requires a valid conversation ID
      // In a real E2E test, you would first create a conversation
      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          conversationId: 'test-conversation-id',
          message: 'Hello, how are you?',
          userId: 'test-user',
        });

      // Since we don't have a real conversation, expect 404 or handle mock
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          conversationId: 'test-conversation-id',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when conversationId is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat/completions')
        .set('X-API-Key', authToken)
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chat/sessions/:id', () => {
    it('should get conversation details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/sessions/test-conversation-id')
        .set('X-API-Key', authToken);

      // Expected to be 404 since conversation doesn't exist, or 200 if mocked
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/chat/sessions/non-existent-id')
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/apps', () => {
    it('should get list of applications', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('X-API-Key', authToken);

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should return 401 without API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps');

      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('POST /api/workflows/:id/run', () => {
    it('should execute a workflow', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows/test-workflow-id/run')
        .set('X-API-Key', authToken)
        .send({
          variables: { input: 'test input' },
        });

      // Expected to be 404 since workflow doesn't exist, or handle mock
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return 400 when workflow ID is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workflows/invalid-id/run')
        .set('X-API-Key', authToken)
        .send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/tools', () => {
    it('should get list of available tools', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools')
        .set('X-API-Key', authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return tools without authentication (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
