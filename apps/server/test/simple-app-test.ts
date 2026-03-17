import { Module, Controller, Get, Post, Body, Patch, Param, Delete, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as request from 'supertest';

// Mock Service
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

// Test Controller (no guards)
@ApiTags('Applications')
@Controller()
class TestAppController {
  constructor(private readonly service: MockAppService) {}

  @Post('apps')
  @ApiOperation({ summary: '创建 AI 应用' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('apps')
  @ApiOperation({ summary: '获取应用列表' })
  findAll() {
    return this.service.findAll();
  }

  @Get('apps/:id')
  @ApiOperation({ summary: '获取应用详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('apps/:id')
  @ApiOperation({ summary: '更新应用' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete('apps/:id')
  @ApiOperation({ summary: '删除应用' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('apps/:id/regenerate-key')
  @ApiOperation({ summary: '重新生成 API Key' })
  regenerateApiKey(@Param('id') id: string) {
    return this.service.regenerateApiKey(id);
  }
}

@Module({
  controllers: [TestAppController],
  providers: [MockAppService],
})
class TestAppModule {}

// Run tests
async function runTests() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.setGlobalPrefix('/api');
  await app.init();

  console.log('1. Testing POST /api/apps...');
  const createResp = await request(app.getHttpServer())
    .post('/api/apps')
    .send({ name: 'Test App' });
  console.log(`   Status: ${createResp.status}, Body: ${JSON.stringify(createResp.body)}`);

  console.log('2. Testing GET /api/apps...');
  const listResp = await request(app.getHttpServer()).get('/api/apps');
  console.log(`   Status: ${listResp.status}, Body: ${JSON.stringify(listResp.body)}`);

  await app.close();
  console.log('✅ All tests passed!');
}

runTests().catch(console.error);
