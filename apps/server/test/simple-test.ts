import { Module, Controller, Get, Post, Body, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

// 简单的 Mock Service
class MockAppService {
  create(data: any) {
    return { id: 'mock-id', name: data.name, apiKey: 'mock-api-key' };
  }
  findAll() {
    return [{ id: 'mock-id', name: 'Mock App' }];
  }
  findOne(id: string) {
    return { id, name: 'Mock App' };
  }
  update(id: string, data: any) {
    return { id, ...data };
  }
  remove(id: string) {
    return { message: 'Deleted' };
  }
  regenerateApiKey(id: string) {
    return { id, apiKey: 'new-mock-key' };
  }
}

// 测试专用 Controller（无 Guard，无前缀问题）
@Controller()
class SimpleTestController {
  constructor(private readonly service: MockAppService) {}

  @Get('test')
  test() {
    return { ok: true };
  }

  @Post('apps')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('apps')
  findAll() {
    return this.service.findAll();
  }
}

@Module({
  controllers: [SimpleTestController],
  providers: [MockAppService],
})
class SimpleTestModule {}

// 运行测试
async function runTest() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [SimpleTestModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.setGlobalPrefix('/api');
  await app.init();

  console.log('Testing GET /api/test...');
  const testResp = await request(app.getHttpServer()).get('/api/test');
  console.log(`Status: ${testResp.status}, Body: ${JSON.stringify(testResp.body)}`);

  console.log('Testing GET /api/apps...');
  const appsResp = await request(app.getHttpServer()).get('/api/apps');
  console.log(`Status: ${appsResp.status}, Body: ${JSON.stringify(appsResp.body)}`);

  await app.close();
}

runTest().catch(console.error);
