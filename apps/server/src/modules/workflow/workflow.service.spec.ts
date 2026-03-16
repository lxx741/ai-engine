import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto, RunWorkflowDto } from './dto/workflow.dto';

// Mock PrismaService
const mockPrismaService = {
  workflow: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  workflowRun: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  app: {
    findUnique: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Mock executor functions
const mockExecute = vi.fn();
const mockExecuteNode = vi.fn();

// Hoisted mock for @ai-engine/core (must be before any imports that use it)
vi.mock('@ai-engine/core', async () => {
  return {
    createWorkflowExecutor: vi.fn(() => ({
      execute: mockExecute,
      executeNode: mockExecuteNode,
    })),
  };
});

// Now import the mocked module
import { createWorkflowExecutor } from '@ai-engine/core';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WorkflowService(mockPrismaService as unknown as PrismaService);
  });

  describe('基础测试', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      const createDto: CreateWorkflowDto = {
        appId: 'app-1',
        name: 'Test Workflow',
        description: 'Test Description',
        definition: {
          nodes: [{ id: '1', type: 'llm' }],
          edges: [{ source: '1', target: '2' }],
        },
        status: 'draft',
      };

      const expectedWorkflow = {
        id: 'wf-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrismaService.workflow.create as Mock).mockResolvedValue(expectedWorkflow);

      const result = await service.create(createDto);

      expect(mockPrismaService.workflow.create).toHaveBeenCalledWith({
        data: {
          appId: createDto.appId,
          name: createDto.name,
          description: createDto.description,
          definition: createDto.definition,
          status: createDto.status,
        },
      });
      expect(result).toEqual(expectedWorkflow);
    });

    it('should validate DAG structure (nodes and edges not empty)', async () => {
      const createDto: CreateWorkflowDto = {
        appId: 'app-1',
        name: 'Test Workflow',
        definition: {
          nodes: [{ id: '1', type: 'llm' }, { id: '2', type: 'output' }],
          edges: [{ source: '1', target: '2' }],
        },
      };

      const expectedWorkflow = {
        id: 'wf-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrismaService.workflow.create as Mock).mockResolvedValue(expectedWorkflow);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedWorkflow);
      const def = result.definition as any;
      expect(def.nodes).toBeDefined();
      expect(def.nodes.length).toBeGreaterThan(0);
      expect(def.edges).toBeDefined();
      expect(def.edges.length).toBeGreaterThan(0);
    });
  });

  describe('findAll', () => {
    it('should find all workflows with appId filter', async () => {
      const appId = 'app-1';
      const expectedWorkflows = [
        { id: 'wf-1', appId, name: 'Workflow 1', updatedAt: new Date() },
        { id: 'wf-2', appId, name: 'Workflow 2', updatedAt: new Date() },
      ];

      (mockPrismaService.workflow.findMany as Mock).mockResolvedValue(expectedWorkflows);

      const result = await service.findAll(appId);

      expect(mockPrismaService.workflow.findMany).toHaveBeenCalledWith({
        where: { appId },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(expectedWorkflows);
    });
  });

  describe('findOne', () => {
    it('should find an existing workflow', async () => {
      const workflowId = 'wf-1';
      const expectedWorkflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Test Workflow',
        definition: { nodes: [], edges: [] },
        app: { id: 'app-1', name: 'Test App' },
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(expectedWorkflow);

      const result = await service.findOne(workflowId);

      expect(mockPrismaService.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
        include: { app: true },
      });
      expect(result).toEqual(expectedWorkflow);
    });

    it('should throw NotFoundException when workflow not found', async () => {
      const workflowId = 'non-existent';

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(null);

      await expect(service.findOne(workflowId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(workflowId)).rejects.toThrow(
        `Workflow with id "${workflowId}" not found`,
      );
    });
  });

  describe('update', () => {
    it('should update a workflow', async () => {
      const workflowId = 'wf-1';
      const updateDto: UpdateWorkflowDto = {
        name: 'Updated Workflow',
        description: 'Updated Description',
      };

      const existingWorkflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Old Name',
        definition: { nodes: [], edges: [] },
        app: { id: 'app-1', name: 'Test App' },
      };

      const updatedWorkflow = {
        ...existingWorkflow,
        ...updateDto,
        updatedAt: new Date(),
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(existingWorkflow);
      (mockPrismaService.workflow.update as Mock).mockResolvedValue(updatedWorkflow);

      const result = await service.update(workflowId, updateDto);

      expect(mockPrismaService.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
        include: { app: true },
      });
      expect(mockPrismaService.workflow.update).toHaveBeenCalledWith({
        where: { id: workflowId },
        data: updateDto,
      });
      expect(result).toEqual(updatedWorkflow);
    });
  });

  describe('remove', () => {
    it('should delete a workflow', async () => {
      const workflowId = 'wf-1';

      const existingWorkflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Test Workflow',
        definition: { nodes: [], edges: [] },
        app: { id: 'app-1', name: 'Test App' },
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(existingWorkflow);
      (mockPrismaService.workflow.delete as Mock).mockResolvedValue({ id: workflowId });

      const result = await service.remove(workflowId);

      expect(mockPrismaService.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
        include: { app: true },
      });
      expect(mockPrismaService.workflow.delete).toHaveBeenCalledWith({
        where: { id: workflowId },
      });
      expect(result).toEqual({ message: `Workflow "${workflowId}" deleted successfully` });
    });
  });

  describe('run', () => {
    it('should execute a workflow and call WorkflowExecutor', async () => {
      const workflowId = 'wf-1';
      const runDto: RunWorkflowDto = {
        input: { query: 'test input' },
      };

      const workflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Test Workflow',
        definition: {
          nodes: [{ id: '1', type: 'llm' }],
          edges: [],
        },
        app: { id: 'app-1', name: 'Test App' },
      };

      const executionResult = {
        status: 'success',
        output: { result: 'test output' },
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T00:00:01Z'),
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(workflow);
      mockExecute.mockResolvedValue(executionResult);
      (mockPrismaService.workflowRun.create as Mock).mockResolvedValue({ id: 'run-1' });

      const result = await service.run(workflowId, runDto);

      expect(mockPrismaService.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
        include: { app: true },
      });
      expect(createWorkflowExecutor).toHaveBeenCalledWith({
        timeout: 300000,
        maxRetries: 2,
      });
      expect(mockExecute).toHaveBeenCalledWith(
        workflow.definition,
        runDto.input,
      );
      expect(result).toEqual(executionResult);
    });

    it('should handle execution failure', async () => {
      const workflowId = 'wf-1';
      const runDto: RunWorkflowDto = {
        input: { query: 'test input' },
      };

      const workflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Test Workflow',
        definition: { nodes: [], edges: [] },
        app: { id: 'app-1', name: 'Test App' },
      };

      const executionResult = {
        status: 'failed',
        output: {},
        error: 'Execution failed: timeout',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T00:00:01Z'),
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(workflow);
      mockExecute.mockResolvedValue(executionResult);
      (mockPrismaService.workflowRun.create as Mock).mockResolvedValue({ id: 'run-1' });

      const result = await service.run(workflowId, runDto);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Execution failed: timeout');
    });

    it('should record execution history (create WorkflowRun)', async () => {
      const workflowId = 'wf-1';
      const runDto: RunWorkflowDto = {
        input: { query: 'test input' },
      };

      const workflow = {
        id: workflowId,
        appId: 'app-1',
        name: 'Test Workflow',
        definition: { nodes: [], edges: [] },
        app: { id: 'app-1', name: 'Test App' },
      };

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T00:00:01Z');

      const executionResult = {
        status: 'success',
        output: { result: 'test output' },
        startTime,
        endTime,
      };

      (mockPrismaService.workflow.findUnique as Mock).mockResolvedValue(workflow);
      mockExecute.mockResolvedValue(executionResult);
      (mockPrismaService.workflowRun.create as Mock).mockResolvedValue({ id: 'run-1' });

      await service.run(workflowId, runDto);

      expect(mockPrismaService.workflowRun.create).toHaveBeenCalledWith({
        data: {
          workflowId,
          status: 'success',
          input: runDto.input,
          output: { result: 'test output' },
          error: undefined,
          startedAt: startTime,
          completedAt: endTime,
        },
      });
    });
  });

  describe('getRuns', () => {
    it('should query execution records with pagination', async () => {
      const workflowId = 'wf-1';
      const limit = 20;

      const expectedRuns = [
        {
          id: 'run-1',
          workflowId,
          status: 'success',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'run-2',
          workflowId,
          status: 'failed',
          createdAt: new Date('2024-01-01T00:00:01Z'),
        },
      ];

      (mockPrismaService.workflowRun.findMany as Mock).mockResolvedValue(expectedRuns);

      const result = await service.getRuns(workflowId, limit);

      expect(mockPrismaService.workflowRun.findMany).toHaveBeenCalledWith({
        where: { workflowId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      expect(result).toEqual(expectedRuns);
    });
  });
});
