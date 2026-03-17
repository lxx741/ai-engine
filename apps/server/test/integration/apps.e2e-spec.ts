import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppTestModule, MOCK_APP_SERVICE, MockAppService } from '../app-test.module';
import { mockTestData } from '../utils/mock-factory';
import request from 'supertest';
import { vi } from 'vitest';

describe('Apps API E2E', () => {
  let app: INestApplication;
  let testApiKey: string;
  let testAppId: string;
  let mockService: MockAppService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
    }).compile();

    mockService = moduleFixture.get<MockAppService>(MOCK_APP_SERVICE);
    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    app.setGlobalPrefix('/api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

    it('should create an app without description', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/apps')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'App without description',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('App without description');
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

    it('should get list without API key (no auth in test module)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get list with any API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/apps')
        .set('X-API-Key', 'any-key');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/apps/:id', () => {
    it('should get app details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });

    it('should get app details by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });
  });

  describe('PATCH /api/apps/:id', () => {
    it('should update an app', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Updated App Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated App Name');
    });
  });

  describe('DELETE /api/apps/:id', () => {
    it('should delete an app', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/apps/${testAppId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/apps/:id/regenerate-key', () => {
    it('should regenerate API key', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/apps/${testAppId}/regenerate-key`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(201);
      expect(response.body.apiKey).toBeDefined();
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
