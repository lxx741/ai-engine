import { Module, Controller, Get, Post, Body, Patch, Param, Delete, Query, Injectable, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Injection tokens
export const MOCK_APP_SERVICE = 'MOCK_APP_SERVICE';
export const MOCK_WORKFLOW_SERVICE = 'MOCK_WORKFLOW_SERVICE';
export const MOCK_CHAT_SERVICE = 'MOCK_CHAT_SERVICE';
export const MOCK_CONVERSATION_SERVICE = 'MOCK_CONVERSATION_SERVICE';
export const MOCK_TOOL_SERVICE = 'MOCK_TOOL_SERVICE';
export const MOCK_MODEL_SERVICE = 'MOCK_MODEL_SERVICE';

// Mock Services
@Injectable()
export class MockAppService {
  async create(data: any) {
    return { id: 'mock-app-id', name: data.name, apiKey: 'mock-api-key', createdAt: new Date() };
  }
  async findAll() {
    return [{ id: 'mock-app-id', name: 'Mock App' }];
  }
  async findOne(id: string) {
    return { id, name: 'Mock App' };
  }
  async update(id: string, data: any) {
    return { id, ...data };
  }
  async remove(id: string) {
    return { message: 'App deleted' };
  }
  async regenerateApiKey(id: string) {
    return { id, apiKey: 'new-mock-key' };
  }
}

@Injectable()
export class MockWorkflowService {
  async create(data: any) {
    return { id: 'mock-workflow-id', name: data.name, appId: data.appId, definition: data.definition };
  }
  async findAll(appId?: string) {
    return [{ id: 'mock-workflow-id', name: 'Mock Workflow', appId }];
  }
  async findOne(id: string) {
    return { id, name: 'Mock Workflow' };
  }
  async update(id: string, data: any) {
    return { id, ...data };
  }
  async remove(id: string) {
    return { message: 'Workflow deleted' };
  }
  async execute(id: string, variables: any) {
    return { id: 'exec-1', workflowId: id, status: 'completed', output: { result: 'success' } };
  }
  async getExecutions(workflowId: string) {
    return [{ id: 'exec-1', workflowId, status: 'completed' }];
  }
}

@Injectable()
export class MockChatService {
  async sendMessage(data: any) {
    return { role: 'assistant', content: 'Mock response', conversationId: data.conversationId };
  }
  async streamResponse(data: any) {
    return [{ content: 'Mock ' }, { content: 'stream ' }, { content: 'response' }];
  }
}

@Injectable()
export class MockConversationService {
  async create(data: any) {
    return { id: 'mock-conversation-id', appId: data.appId, title: 'Mock Conversation' };
  }
  async findAll(appId?: string) {
    return [{ id: 'mock-conversation-id', appId }];
  }
  async findOne(id: string) {
    return { id, title: 'Mock Conversation' };
  }
  async remove(id: string) {
    return { message: 'Conversation deleted' };
  }
}

@Injectable()
export class MockToolService {
  async listTools() {
    return [
      { name: 'http', description: 'HTTP 工具', parameters: {} },
      { name: 'code', description: '代码工具', parameters: {} },
      { name: 'time', description: '时间工具', parameters: {} },
    ];
  }
  async getTool(name: string) {
    return { name, description: `${name}工具`, parameters: {} };
  }
  async executeTool(name: string, params: any) {
    return { success: true, output: 'mock tool output' };
  }
}

@Injectable()
export class MockModelService {
  async findAll() {
    return [{ id: 'mock-model-id', name: 'qwen3.5:9b', provider: 'ollama', isActive: true }];
  }
  async findOne(id: string) {
    return { id, name: 'qwen3.5:9b', provider: 'ollama' };
  }
  async findActive() {
    return { id: 'mock-model-id', name: 'qwen3.5:9b', provider: 'ollama' };
  }
}

// Test Controllers
@ApiTags('Applications')
@Controller()
export class FullFlowAppController {
  constructor(@Inject(MOCK_APP_SERVICE) private readonly appService: MockAppService) {}

  @Post('apps')
  create(@Body() data: any) {
    return this.appService.create(data);
  }

  @Get('apps')
  findAll() {
    return this.appService.findAll();
  }

  @Post('apps/:id/regenerate-key')
  regenerateApiKey(@Param('id') id: string) {
    return this.appService.regenerateApiKey(id);
  }

  @Delete('apps/:id')
  remove(@Param('id') id: string) {
    return this.appService.remove(id);
  }
}

@ApiTags('Workflows')
@Controller()
export class FullFlowWorkflowController {
  constructor(@Inject(MOCK_WORKFLOW_SERVICE) private readonly workflowService: MockWorkflowService) {}

  @Post('workflows')
  create(@Body() data: any) {
    return this.workflowService.create(data);
  }

  @Get('workflows')
  findAll(@Query('appId') appId?: string) {
    return this.workflowService.findAll(appId);
  }

  @Get('workflows/:id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Delete('workflows/:id')
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post('workflows/:id/run')
  execute(@Param('id') id: string, @Body() data: any) {
    return this.workflowService.execute(id, data.variables);
  }

  @Get('workflows/:id/executions')
  getExecutions(@Param('id') id: string) {
    return this.workflowService.getExecutions(id);
  }
}

@ApiTags('Chat')
@Controller()
export class FullFlowChatController {
  constructor(
    @Inject(MOCK_CHAT_SERVICE) private readonly chatService: MockChatService,
    @Inject(MOCK_CONVERSATION_SERVICE) private readonly conversationService: MockConversationService,
  ) {}

  @Post('chat/completions')
  sendMessage(@Body() data: any) {
    return this.chatService.sendMessage(data);
  }

  @Post('chat/sessions')
  createConversation(@Body() data: any) {
    return this.conversationService.create(data);
  }

  @Get('chat/sessions/:id')
  getConversation(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  @Get('chat/sessions/:id/messages')
  getMessages(@Param('id') id: string) {
    return [{ id: 'msg-1', content: 'Mock message' }];
  }
}

@ApiTags('Tools')
@Controller()
export class FullFlowToolController {
  constructor(@Inject(MOCK_TOOL_SERVICE) private readonly toolService: MockToolService) {}

  @Get('tools')
  listTools() {
    return this.toolService.listTools();
  }

  @Post('tools/:name/execute')
  executeTool(@Param('name') name: string, @Body() params: any) {
    return this.toolService.executeTool(name, params);
  }
}

@ApiTags('Models')
@Controller()
export class FullFlowModelController {
  constructor(@Inject(MOCK_MODEL_SERVICE) private readonly modelService: MockModelService) {}

  @Get('models')
  listModels() {
    return this.modelService.findAll();
  }

  @Get('models/default/active')
  getActiveModel() {
    return this.modelService.findActive();
  }
}

/**
 * 测试专用 FullFlowModule
 * 包含所有完整流程需要的 Mock Services
 */
@Module({
  controllers: [
    FullFlowAppController,
    FullFlowWorkflowController,
    FullFlowChatController,
    FullFlowToolController,
    FullFlowModelController,
  ],
  providers: [
    { provide: MOCK_APP_SERVICE, useClass: MockAppService },
    { provide: MOCK_WORKFLOW_SERVICE, useClass: MockWorkflowService },
    { provide: MOCK_CHAT_SERVICE, useClass: MockChatService },
    { provide: MOCK_CONVERSATION_SERVICE, useClass: MockConversationService },
    { provide: MOCK_TOOL_SERVICE, useClass: MockToolService },
    { provide: MOCK_MODEL_SERVICE, useClass: MockModelService },
  ],
})
export class FullFlowTestModule {}
