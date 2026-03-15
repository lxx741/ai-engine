import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto, RunWorkflowDto } from './dto/workflow.dto';
import { ApiKeyGuard, Public } from '../../auth/api-key.guard';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('X-API-Key')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: '创建工作流' })
  @ApiResponse({ status: 201, description: '工作流创建成功' })
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowService.create(createWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: '获取工作流列表' })
  @ApiResponse({ status: 200, description: '返回工作流列表' })
  findAll(
    @Query('appId') appId?: string,
    @Query('status') status?: string,
  ) {
    return this.workflowService.findAll(appId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工作流详情' })
  @ApiResponse({ status: 200, description: '返回工作流详情' })
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新工作流' })
  @ApiResponse({ status: 200, description: '工作流更新成功' })
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowService.update(id, updateWorkflowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工作流' })
  @ApiResponse({ status: 200, description: '工作流删除成功' })
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post(':id/run')
  @ApiOperation({ summary: '执行工作流' })
  @ApiResponse({ status: 200, description: '工作流执行成功' })
  run(
    @Param('id') id: string,
    @Body() runWorkflowDto: RunWorkflowDto,
  ) {
    return this.workflowService.run(id, runWorkflowDto);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: '获取工作流执行记录' })
  @ApiResponse({ status: 200, description: '返回执行记录列表' })
  getRuns(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.workflowService.getRuns(id, limit ? parseInt(String(limit), 10) : 20);
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: '获取执行记录详情' })
  @ApiResponse({ status: 200, description: '返回执行记录详情' })
  getRun(@Param('runId') runId: string) {
    return this.workflowService.getRun(runId);
  }
}
