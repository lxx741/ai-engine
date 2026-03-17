import { vi } from 'vitest';

/**
 * E2E 测试 Mock 工厂
 * 提供统一的 Mock 数据和服务，确保测试一致性
 */

// Mock 测试数据
export const mockTestData = {
  app: {
    id: 'mock-app-id-123',
    name: 'Mock Test App',
    description: 'Mock app for E2E tests',
    apiKey: 'mock-api-key-xyz',
    createdAt: new Date(),
  },
  conversation: {
    id: 'mock-conversation-id-456',
    appId: 'mock-app-id-123',
    title: 'Mock Conversation',
    userId: 'mock-user-id',
    createdAt: new Date(),
  },
  message: {
    id: 'mock-message-id-789',
    conversationId: 'mock-conversation-id-456',
    role: 'user',
    content: 'Mock message content',
    createdAt: new Date(),
  },
  workflow: {
    id: 'mock-workflow-id-abc',
    appId: 'mock-app-id-123',
    name: 'Mock Workflow',
    description: 'Mock workflow for E2E tests',
    definition: {
      nodes: [
        { id: 'start', type: 'start', config: {} },
        { id: 'end', type: 'end', config: {} },
      ],
      edges: [{ source: 'start', target: 'end' }],
    },
    createdAt: new Date(),
  },
  workflowRun: {
    id: 'mock-workflow-run-id-def',
    workflowId: 'mock-workflow-id-abc',
    status: 'completed',
    input: {},
    output: { result: 'mock output' },
    createdAt: new Date(),
  },
  model: {
    id: 'mock-model-id-ghi',
    name: 'qwen3.5:9b',
    provider: 'ollama',
    isActive: true,
    createdAt: new Date(),
  },
};

/**
 * 创建 PrismaService Mock
 */
export function createPrismaMock() {
  return {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn().mockImplementation((fn) => fn(mockPrisma)),
    
    app: {
      create: vi.fn().mockResolvedValue(mockTestData.app),
      findMany: vi.fn().mockResolvedValue([mockTestData.app]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.app),
      findFirst: vi.fn().mockResolvedValue(mockTestData.app),
      update: vi.fn().mockResolvedValue(mockTestData.app),
      delete: vi.fn().mockResolvedValue(mockTestData.app),
      count: vi.fn().mockResolvedValue(1),
    },
    
    conversation: {
      create: vi.fn().mockResolvedValue(mockTestData.conversation),
      findMany: vi.fn().mockResolvedValue([mockTestData.conversation]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.conversation),
      findFirst: vi.fn().mockResolvedValue(mockTestData.conversation),
      update: vi.fn().mockResolvedValue(mockTestData.conversation),
      delete: vi.fn().mockResolvedValue(mockTestData.conversation),
      count: vi.fn().mockResolvedValue(1),
    },
    
    message: {
      create: vi.fn().mockResolvedValue(mockTestData.message),
      findMany: vi.fn().mockResolvedValue([mockTestData.message]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.message),
      findFirst: vi.fn().mockResolvedValue(mockTestData.message),
      update: vi.fn().mockResolvedValue(mockTestData.message),
      delete: vi.fn().mockResolvedValue(mockTestData.message),
      count: vi.fn().mockResolvedValue(1),
    },
    
    workflow: {
      create: vi.fn().mockResolvedValue(mockTestData.workflow),
      findMany: vi.fn().mockResolvedValue([mockTestData.workflow]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.workflow),
      findFirst: vi.fn().mockResolvedValue(mockTestData.workflow),
      update: vi.fn().mockResolvedValue(mockTestData.workflow),
      delete: vi.fn().mockResolvedValue(mockTestData.workflow),
      count: vi.fn().mockResolvedValue(1),
    },
    
    workflowRun: {
      create: vi.fn().mockResolvedValue(mockTestData.workflowRun),
      findMany: vi.fn().mockResolvedValue([mockTestData.workflowRun]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.workflowRun),
      findFirst: vi.fn().mockResolvedValue(mockTestData.workflowRun),
      update: vi.fn().mockResolvedValue(mockTestData.workflowRun),
      delete: vi.fn().mockResolvedValue(mockTestData.workflowRun),
      count: vi.fn().mockResolvedValue(1),
    },
    
    model: {
      create: vi.fn().mockResolvedValue(mockTestData.model),
      findMany: vi.fn().mockResolvedValue([mockTestData.model]),
      findUnique: vi.fn().mockResolvedValue(mockTestData.model),
      findFirst: vi.fn().mockResolvedValue(mockTestData.model),
      update: vi.fn().mockResolvedValue(mockTestData.model),
      delete: vi.fn().mockResolvedValue(mockTestData.model),
      count: vi.fn().mockResolvedValue(1),
    },
  };
}

const mockPrisma = createPrismaMock();

/**
 * 创建 AppService Mock
 */
export function createAppServiceMock() {
  return {
    create: vi.fn().mockResolvedValue(mockTestData.app),
    findAll: vi.fn().mockResolvedValue([mockTestData.app]),
    findOne: vi.fn().mockResolvedValue(mockTestData.app),
    update: vi.fn().mockResolvedValue(mockTestData.app),
    remove: vi.fn().mockResolvedValue({ message: 'App deleted successfully' }),
    regenerateApiKey: vi.fn().mockResolvedValue({ ...mockTestData.app, apiKey: 'new-mock-api-key' }),
  };
}

/**
 * 创建 ConversationService Mock
 */
export function createConversationServiceMock() {
  return {
    create: vi.fn().mockResolvedValue(mockTestData.conversation),
    findAll: vi.fn().mockResolvedValue([mockTestData.conversation]),
    findOne: vi.fn().mockResolvedValue(mockTestData.conversation),
    remove: vi.fn().mockResolvedValue({ message: 'Conversation deleted successfully' }),
  };
}

/**
 * 创建 MessageService Mock
 */
export function createMessageServiceMock() {
  return {
    create: vi.fn().mockResolvedValue(mockTestData.message),
    findAll: vi.fn().mockResolvedValue([mockTestData.message]),
    findOne: vi.fn().mockResolvedValue(mockTestData.message),
    remove: vi.fn().mockResolvedValue({ message: 'Message deleted successfully' }),
  };
}

/**
 * 创建 ChatService Mock
 */
export function createChatServiceMock() {
  return {
    sendMessage: vi.fn().mockResolvedValue({
      role: 'assistant',
      content: 'Mock response from assistant',
      conversationId: mockTestData.conversation.id,
    }),
    streamResponse: vi.fn().mockImplementation(async function* () {
      yield { content: 'Mock ' };
      yield { content: 'stream ' };
      yield { content: 'response' };
    }),
  };
}

/**
 * 创建 WorkflowService Mock
 */
export function createWorkflowServiceMock() {
  return {
    create: vi.fn().mockResolvedValue(mockTestData.workflow),
    findAll: vi.fn().mockResolvedValue([mockTestData.workflow]),
    findOne: vi.fn().mockResolvedValue(mockTestData.workflow),
    update: vi.fn().mockResolvedValue(mockTestData.workflow),
    remove: vi.fn().mockResolvedValue({ message: 'Workflow deleted successfully' }),
    execute: vi.fn().mockResolvedValue({
      id: mockTestData.workflowRun.id,
      status: 'completed',
      output: { result: 'mock workflow output' },
    }),
    getExecutions: vi.fn().mockResolvedValue([mockTestData.workflowRun]),
  };
}

/**
 * 创建 ModelService Mock
 */
export function createModelServiceMock() {
  return {
    findAll: vi.fn().mockResolvedValue([mockTestData.model]),
    findOne: vi.fn().mockResolvedValue(mockTestData.model),
    findActive: vi.fn().mockResolvedValue(mockTestData.model),
  };
}

/**
 * 创建 ToolService Mock（已有，保持兼容）
 */
export function createToolServiceMock() {
  return {
    listTools: vi.fn().mockReturnValue([
      { name: 'http', description: 'HTTP 工具', parameters: {} },
      { name: 'code', description: '代码工具', parameters: {} },
      { name: 'time', description: '时间工具', parameters: {} },
    ]),
    getTool: vi.fn().mockImplementation((name: string) => ({
      name,
      description: `${name}工具`,
      parameters: {},
    })),
    executeTool: vi.fn().mockResolvedValue({
      success: true,
      output: 'mock tool output',
    }),
  };
}

/**
 * 创建完整的 Mock 集合
 */
export function createAllMocks() {
  return {
    prisma: createPrismaMock(),
    appService: createAppServiceMock(),
    conversationService: createConversationServiceMock(),
    messageService: createMessageServiceMock(),
    chatService: createChatServiceMock(),
    workflowService: createWorkflowServiceMock(),
    modelService: createModelServiceMock(),
    toolService: createToolServiceMock(),
  };
}

/**
 * 清除所有 Mock 调用历史
 */
export function clearAllMocks(mocks: ReturnType<typeof createAllMocks>) {
  Object.values(mocks).forEach((mockObj) => {
    Object.values(mockObj).forEach((mockFn) => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        (mockFn as any).mockClear();
      }
    });
  });
}

/**
 * 重置所有 Mock 实现
 */
export function resetAllMocks(mocks: ReturnType<typeof createAllMocks>) {
  Object.values(mocks).forEach((mockObj) => {
    Object.values(mockObj).forEach((mockFn) => {
      if (typeof mockFn === 'function' && 'mockReset' in mockFn) {
        (mockFn as any).mockReset();
      }
    });
  });
}

/**
 * 恢复所有 Mock 到默认实现
 */
export function restoreAllMocks(mocks: ReturnType<typeof createAllMocks>) {
  Object.values(mocks).forEach((mockObj) => {
    Object.values(mockObj).forEach((mockFn) => {
      if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
        (mockFn as any).mockRestore();
      }
    });
  });
}
