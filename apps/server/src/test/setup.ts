import { vi } from 'vitest';

// 1. Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn((fn) => fn(mockPrismaClient)),
    conversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    app: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    model: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    workflow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    workflowRun: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    tool: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
    Prisma: {},
  };
});

// 2. Mock Providers
vi.mock('@ai-engine/providers', () => ({
  getProviderFactory: vi.fn(() => ({
    getProviderForModel: vi.fn(),
    getModelName: vi.fn(),
    createModelConfig: vi.fn(),
    healthCheck: vi.fn(),
    healthCheckAll: vi.fn(),
  })),
}));

// 3. Mock Core
vi.mock('@ai-engine/core', () => ({
  WorkflowExecutor: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    executeNode: vi.fn(),
  })),
  createWorkflowExecutor: vi.fn(),
}));
