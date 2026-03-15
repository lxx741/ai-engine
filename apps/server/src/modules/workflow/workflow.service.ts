import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto, RunWorkflowDto } from './dto/workflow.dto';
import { createWorkflowExecutor } from '@ai-engine/core';
import { WorkflowExecutionResult } from '@ai-engine/shared';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkflowDto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        appId: createWorkflowDto.appId,
        name: createWorkflowDto.name,
        description: createWorkflowDto.description,
        definition: createWorkflowDto.definition,
        status: createWorkflowDto.status || 'draft',
      },
    });
  }

  async findAll(appId?: string, status?: string) {
    const where: any = {};
    if (appId) where.appId = appId;
    if (status) where.status = status;

    return this.prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        app: true,
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with id "${id}" not found`);
    }

    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    await this.findOne(id);

    return this.prisma.workflow.update({
      where: { id },
      data: updateWorkflowDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.workflow.delete({
      where: { id },
    });
    return { message: `Workflow "${id}" deleted successfully` };
  }

  async run(id: string, runWorkflowDto: RunWorkflowDto): Promise<WorkflowExecutionResult> {
    const workflow = await this.findOne(id);

    const executor = createWorkflowExecutor({
      timeout: 300000,
      maxRetries: 2,
    });

    const result = await executor.execute(
      workflow.definition as any,
      runWorkflowDto.input || {},
    );

    await this.prisma.workflowRun.create({
      data: {
        workflowId: id,
        status: result.status,
        input: runWorkflowDto.input || {},
        output: result.output,
        error: result.error,
        startedAt: result.startTime,
        completedAt: result.endTime,
      },
    });

    return result;
  }

  async getRuns(workflowId: string, limit: number = 20) {
    return this.prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRun(runId: string) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      throw new NotFoundException(`Run with id "${runId}" not found`);
    }

    return run;
  }
}
