import { Module, Controller, Get, Post, Body, Patch, Param, Delete, Injectable, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Injection token for mock service
export const MOCK_APP_SERVICE = 'MOCK_APP_SERVICE';

// Mock AppService for testing
export class MockAppService {
  async create(data: any) {
    return { 
      id: 'mock-app-id', 
      name: data.name, 
      description: data.description,
      apiKey: 'mock-api-key-123',
      createdAt: new Date(),
    };
  }

  async findAll() {
    return [
      { id: 'mock-app-id-1', name: 'App 1', apiKey: 'key1' },
      { id: 'mock-app-id-2', name: 'App 2', apiKey: 'key2' },
    ];
  }

  async findOne(id: string) {
    return { id, name: 'Mock App', apiKey: 'mock-key' };
  }

  async update(id: string, data: any) {
    return { id, ...data };
  }

  async remove(id: string) {
    return { message: `App "${id}" deleted successfully` };
  }

  async regenerateApiKey(id: string) {
    return { id, apiKey: 'new-mock-api-key' };
  }
}

/**
 * 测试专用 AppController
 * 不使用 ApiKeyGuard，用于 E2E 测试
 */
@ApiTags('Applications')
@Controller()
export class AppTestController {
  constructor(@Inject(MOCK_APP_SERVICE) private readonly appService: MockAppService) {}

  @Post('apps')
  @ApiOperation({ summary: '创建 AI 应用' })
  @ApiResponse({ status: 201, description: '应用创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  create(@Body() createAppDto: any) {
    return this.appService.create(createAppDto);
  }

  @Get('apps')
  @ApiOperation({ summary: '获取应用列表' })
  @ApiResponse({ status: 200, description: '返回应用列表' })
  findAll() {
    return this.appService.findAll();
  }

  @Get('apps/:id')
  @ApiOperation({ summary: '获取应用详情' })
  @ApiResponse({ status: 200, description: '返回应用详情' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  @Patch('apps/:id')
  @ApiOperation({ summary: '更新应用' })
  @ApiResponse({ status: 200, description: '应用更新成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  update(@Param('id') id: string, @Body() updateAppDto: any) {
    return this.appService.update(id, updateAppDto);
  }

  @Delete('apps/:id')
  @ApiOperation({ summary: '删除应用' })
  @ApiResponse({ status: 200, description: '应用删除成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  remove(@Param('id') id: string) {
    return this.appService.remove(id);
  }

  @Post('apps/:id/regenerate-key')
  @ApiOperation({ summary: '重新生成 API Key' })
  @ApiResponse({ status: 200, description: 'API Key 重新生成成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  regenerateApiKey(@Param('id') id: string) {
    return this.appService.regenerateApiKey(id);
  }
}

/**
 * 测试专用 AppModule
 * 使用 Mock Service，不依赖数据库
 */
@Module({
  controllers: [AppTestController],
  providers: [
    {
      provide: MOCK_APP_SERVICE,
      useClass: MockAppService,
    },
  ],
})
export class AppTestModule {}
