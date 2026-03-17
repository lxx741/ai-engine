/**
 * E2E 测试数据种子
 * 提供标准化的测试数据用于集成测试
 */

export interface TestAppData {
  id?: string
  name: string
  description: string
  apiKey: string
}

export interface TestConversationData {
  id?: string
  appId: string
  title: string
  userId: string
}

export interface TestWorkflowData {
  id?: string
  appId: string
  name: string
  description: string
  definition: {
    nodes: Array<{
      id: string
      type: string
      config: Record<string, any>
    }>
    edges: Array<{
      source: string
      target: string
    }>
  }
}

/**
 * 标准测试应用数据
 */
export const TEST_APP: TestAppData = {
  name: 'E2E Test Application',
  description: 'Standard test application for E2E tests',
  apiKey: 'test-api-key-e2e-standard',
}

/**
 * 标准测试会话数据
 */
export const createTestConversation = (appId: string): TestConversationData => ({
  appId,
  title: 'E2E Test Conversation',
  userId: 'test-user-e2e',
})

/**
 * 标准测试工作流数据（简单流程）
 */
export const createTestWorkflow = (appId: string): TestWorkflowData => ({
  appId,
  name: 'E2E Test Workflow',
  description: 'Standard test workflow for E2E tests',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        config: {
          variables: [
            { name: 'input', type: 'string', required: true },
          ],
        },
      },
      {
        id: 'end',
        type: 'end',
        config: {
          output: '{{ nodes.start.output.input }}',
        },
      },
    ],
    edges: [
      { source: 'start', target: 'end' },
    ],
  },
})

/**
 * 标准测试工作流数据（带 LLM 节点）
 */
export const createTestWorkflowWithLLM = (appId: string): TestWorkflowData => ({
  appId,
  name: 'E2E Test Workflow with LLM',
  description: 'Test workflow with LLM node for E2E tests',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        config: {
          variables: [
            { name: 'question', type: 'string', required: true },
          ],
        },
      },
      {
        id: 'llm',
        type: 'llm',
        config: {
          modelId: 'qwen3.5:9b',
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: '{{ nodes.start.output.question }}',
        },
      },
      {
        id: 'end',
        type: 'end',
        config: {
          output: '{{ nodes.llm.output.content }}',
        },
      },
    ],
    edges: [
      { source: 'start', target: 'llm' },
      { source: 'llm', target: 'end' },
    ],
  },
})

/**
 * 标准测试工作流数据（带条件判断）
 */
export const createTestWorkflowWithCondition = (appId: string): TestWorkflowData => ({
  appId,
  name: 'E2E Test Workflow with Condition',
  description: 'Test workflow with condition node for E2E tests',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        config: {
          variables: [
            { name: 'score', type: 'number', required: true },
          ],
        },
      },
      {
        id: 'condition',
        type: 'condition',
        config: {
          condition: '{{ nodes.start.output.score }} >= 60',
        },
      },
      {
        id: 'pass',
        type: 'end',
        config: {
          output: 'Pass',
        },
      },
      {
        id: 'fail',
        type: 'end',
        config: {
          output: 'Fail',
        },
      },
    ],
    edges: [
      { source: 'start', target: 'condition' },
      { source: 'condition', target: 'pass', condition: 'true' },
      { source: 'condition', target: 'fail', condition: 'false' },
    ],
  },
})

/**
 * 生成唯一的测试标识符
 */
export function generateTestSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 创建带唯一标识的测试应用数据
 */
export function createUniqueTestApp(): TestAppData {
  const suffix = generateTestSuffix()
  return {
    name: `Test App ${suffix}`,
    description: `Test application for E2E tests - ${suffix}`,
    apiKey: `test-api-key-${suffix}`,
  }
}
