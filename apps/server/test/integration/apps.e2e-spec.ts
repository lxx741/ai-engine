import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppTestModule } from '../app-test.module';
import { mockTestData } from '../utils/mock-factory';
import request from 'supertest';

describe('Apps API E2E', () => {
  let app: INestApplication;
  let testApiKey: string;
  let testAppId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
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

  beforeEach(() => {
    testApiKey = mockTestData.app.apiKey;
    testAppId = mockTestData.app.id;
  });

  describe('POST /api/apps', () => {
    it('should create an app and return apiKey', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/apps')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Test App',
          description: 'Test Application for E2E',
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test App');
      expect(response.body.apiKey).toBeDefined();
      
      testAppId = response.body.id;
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/apps')
        .set('X-API-Key', testApiKey)
        .send({
          description: 'Missing name field',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/apps', () => {
    it('should get list of applications', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps');

      expect(response.status).toBe(401);
    });

    it('should return 403 with invalid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/apps/:id', () => {
    it('should get app details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAppId);
      expect(response.body.name).toBe(mockTestData.app.name);
    });

    it('should return 404 for non-existent app', async () => {
      mocks.appService.findOne.mockRejectedValue({
        status: 404,
        message: 'App not found',
      });

      const response = await request(app.getHttpServer())
        .get('/api/apps/non-existent-id')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(404);

      mocks.appService.findOne.mockResolvedValue(mockTestData.app);
    });
  });

  describe('PATCH /api/apps/:id', () => {
    it('should update an app', async () => {
      mocks.appService.update.mockResolvedValue({
        ...mockTestData.app,
        name: 'Updated App Name',
        description: 'Updated description',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Updated App Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated App Name');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/apps/:id', () => {
    it('should delete an app', async () => {
      mocks.appService.remove.mockResolvedValue({ message: 'App deleted successfully' });
      mocks.appService.findOne.mockRejectedValueOnce({ status: 404, message: 'App not found' });

      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/apps/:id/regenerate-key', () => {
    it('should regenerate API key', async () => {
      mocks.appService.regenerateApiKey.mockResolvedValue({
        ...mockTestData.app,
        apiKey: 'new-regenerated-api-key',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/apps/${testAppId}/regenerate-key`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey).not.toBe(testApiKey);
    });
  });

  describe('Protected Resource Access', () => {
    it('should access protected resource with valid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
