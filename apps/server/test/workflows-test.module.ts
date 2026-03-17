import { Module, Controller, Get, Post, Body, Patch, Param, Delete, Query, Injectable, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Injection token for mock service
export const MOCK_WORKFLOW_SERVICE = 'MOCK_WORKFLOW_SERVICE';

// Mock WorkflowService for testing
export class MockWorkflowService {
  async create(data: any) {
    return {
      id: 'mock-workflow-id',
      name: data.name,
      description: data.description,
      appId: data.appId,
      definition: {
        nodes: data.nodes || [],
        edges: data.edges || [],
      },
      createdAt: new Date(),
    };
  }

  async findAll(appId?: string, status?: string) {
    return [
      { id: 'workflow-1', name: 'Workflow 1', appId: appId || 'app-1' },
      { id: 'workflow-2', name: 'Workflow 2', appId: appId || 'app-1' },
    ];
  }

  async findOne(id: string) {
    return {
      id,
      name: 'Mock Workflow',
      description: 'Test workflow',
      appId: 'app-1',
      definition: {
        nodes: [{ id: 'start', type: 'start' }],
        edges: [],
      },
    };
  }

  async update(id: string, data: any) {
    return { id, ...data };
  }

  async remove(id: string) {
    return { message: `Workflow "${id}" deleted successfully` };
  }

  async execute(id: string, variables: any) {
    return {
      id: `exec-${Date.now()}`,
      workflowId: id,
      status: 'completed',
      input: variables,
      output: { result: 'workflow executed successfully' },
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }

  async getExecutions(workflowId: string) {
    return [
      {
        id: 'exec-1',
        workflowId,
        status: 'completed',
        output: { result: 'output 1' },
      },
      {
        id: 'exec-2',
        workflowId,
        status: 'failed',
        error: 'Test error',
      },
    ];
  }
}

/**
 * 测试专用 WorkflowsController
 * 不使用 ApiKeyGuard，用于 E2E 测试
 */
@ApiTags('Workflows')
@Controller()
export class WorkflowsTestController {
  constructor(@Inject(MOCK_WORKFLOW_SERVICE) private readonly workflowService: MockWorkflowService) {}

  @Post('workflows')
  @ApiOperation({ summary: '创建工作流' })
  @ApiResponse({ status: 201, description: '工作流创建成功' })
  create(@Body() createWorkflowDto: any) {
    return this.workflowService.create(createWorkflowDto);
  }

  @Get('workflows')
  @ApiOperation({ summary: '获取工作流列表' })
  @ApiResponse({ status: 200, description: '返回工作流列表' })
  findAll(@Query('appId') appId?: string, @Query('status') status?: string) {
    return this.workflowService.findAll(appId, status);
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: '获取工作流详情' })
  @ApiResponse({ status: 200, description: '返回工作流详情' })
  @ApiResponse({ status: 404, description: '工作流不存在' })
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Patch('workflows/:id')
  @ApiOperation({ summary: '更新工作流' })
  @ApiResponse({ status: 200, description: '工作流更新成功' })
  update(@Param('id') id: string, @Body() updateWorkflowDto: any) {
    return this.workflowService.update(id, updateWorkflowDto);
  }

  @Delete('workflows/:id')
  @ApiOperation({ summary: '删除工作流' })
  @ApiResponse({ status: 200, description: '工作流删除成功' })
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post('workflows/:id/run')
  @ApiOperation({ summary: '执行工作流' })
  @ApiResponse({ status: 200, description: '工作流执行成功' })
  @ApiResponse({ status: 404, description: '工作流不存在' })
  execute(@Param('id') id: string, @Body() runWorkflowDto: any) {
    return this.workflowService.execute(id, runWorkflowDto.variables);
  }

  @Get('workflows/:id/executions')
  @ApiOperation({ summary: '获取工作流执行历史' })
  @ApiResponse({ status: 200, description: '返回执行历史' })
  getExecutions(@Param('id') id: string) {
    return this.workflowService.getExecutions(id);
  }
}

/**
 * 测试专用 WorkflowsModule
 * 使用 Mock Service，不依赖数据库
 */
@Module({
  controllers: [WorkflowsTestController],
  providers: [
    {
      provide: MOCK_WORKFLOW_SERVICE,
      useClass: MockWorkflowService,
    },
  ],
})
export class WorkflowsTestModule {}
