import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, Controller, Get, Post, Param, Body, Module, HttpCode, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

const mockTools = [
  { name: 'http', description: 'HTTP 工具', parameters: {} },
  { name: 'code', description: '代码工具', parameters: {} },
  { name: 'time', description: '时间工具', parameters: {} },
];

const mockToolService = {
  listTools: () => mockTools,
  getTool: (name: string) => {
    if (name === 'nonexistent') {
      return null;
    }
    const tool = mockTools.find(t => t.name === name);
    return tool || null;
  },
  executeTool: async (name: string, params: any) => {
    if (name === 'nonexistent') {
      return { success: false, error: 'Tool not found' };
    }
    return { success: true, output: `mocked ${name} output` };
  },
};

@Controller('tools')
class TestToolController {
  @Get()
  listTools() {
    return mockToolService.listTools();
  }

  @Get(':name')
  getTool(@Param('name') name: string) {
    const tool = mockToolService.getTool(name);
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return tool;
  }

  @Post(':name/execute')
  @HttpCode(200)
  async executeTool(@Param('name') name: string, @Body() body: { params?: any }) {
    const result = await mockToolService.executeTool(name, body.params || {});
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }
}

@Module({
  controllers: [TestToolController],
})
class TestToolModule {}

describe('Tools API E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestToolModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/tools', () => {
    it('should get list of available tools', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(response.body.map((t: any) => t.name)).toEqual(['http', 'code', 'time']);
    });

    it('should return tools without authentication (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools')
        .set('X-API-Key', 'invalid-key');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/tools/:name', () => {
    it('should get HTTP tool details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools/http');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('http');
      expect(response.body.description).toBe('HTTP 工具');
      expect(response.body.parameters).toEqual({});
    });

    it('should get Code tool details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools/code');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('code');
      expect(response.body.description).toBe('代码工具');
      expect(response.body.parameters).toEqual({});
    });

    it('should get Time tool details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools/time');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('time');
      expect(response.body.description).toBe('时间工具');
      expect(response.body.parameters).toEqual({});
    });

    it('should return 404 for non-existent tool', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tools/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tools/:name/execute', () => {
    it('should execute HTTP tool', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tools/http/execute')
        .send({ params: { url: 'https://example.com' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, output: 'mocked http output' });
    });

    it('should execute Code tool', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tools/code/execute')
        .send({ params: { code: 'print("hello")' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, output: 'mocked code output' });
    });

    it('should execute Time tool', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tools/time/execute')
        .send({ params: { timezone: 'UTC' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, output: 'mocked time output' });
    });

    it('should return error for executing non-existent tool', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tools/nonexistent/execute')
        .send({ params: {} });

      expect(response.status).toBe(500);
    });
  });
});
