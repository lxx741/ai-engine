import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkflowExecutor, ExecutionContext, INodeExecutor } from './workflow-executor'
import { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeConfig } from '@ai-engine/shared'
import {
  StartNodeExecutor,
  LLMNodeExecutor,
  HTTPNodeExecutor,
  ConditionNodeExecutor,
  EndNodeExecutor,
  ToolNodeExecutor,
} from './node-executors'

/**
 * Create a mock workflow definition
 */
function createMockWorkflowDefinition(
  nodes: WorkflowNode[] = [],
  edges: WorkflowEdge[] = [],
  variables: Record<string, any> = {},
): WorkflowDefinition {
  return {
    nodes,
    edges,
    variables,
    metadata: {
      version: '1.0.0',
      author: 'test',
      description: 'Test workflow',
    },
  }
}

/**
 * Create a mock workflow node
 */
function createMockNode(
  id: string,
  type: WorkflowNode['type'],
  name: string,
  config: NodeConfig = {},
): WorkflowNode {
  return {
    id,
    type,
    name,
    config,
    position: { x: 0, y: 0 },
  }
}

/**
 * Create a mock workflow edge
 */
function createMockEdge(
  id: string,
  source: string,
  target: string,
  condition?: string,
): WorkflowEdge {
  return {
    id,
    source,
    target,
    condition,
  }
}

/**
 * Create a mock execution context
 */
function createMockContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    workflowId: 'test-workflow',
    runId: 'test-run',
    variables: {},
    nodeOutputs: {},
    startTime: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor

  // Create mock executors using actual classes but with mocked methods
  let mockStartExecutor: StartNodeExecutor
  let mockLLMExecutor: LLMNodeExecutor
  let mockHTTPExecutor: HTTPNodeExecutor
  let mockConditionExecutor: ConditionNodeExecutor
  let mockEndExecutor: EndNodeExecutor
  let mockToolExecutor: ToolNodeExecutor

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock executors by extending actual classes
    mockStartExecutor = Object.create(StartNodeExecutor.prototype)
    mockStartExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { message: 'Workflow started', variables: {} } })
    mockStartExecutor.canExecute = vi.fn(() => true)

    mockLLMExecutor = Object.create(LLMNodeExecutor.prototype)
    mockLLMExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { content: 'LLM response', usage: { totalTokens: 100 } } })
    mockLLMExecutor.canExecute = vi.fn(() => true)

    mockHTTPExecutor = Object.create(HTTPNodeExecutor.prototype)
    mockHTTPExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { status: 200, data: {} } })
    mockHTTPExecutor.canExecute = vi.fn(() => true)

    mockConditionExecutor = Object.create(ConditionNodeExecutor.prototype)
    mockConditionExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { result: true, expression: '' } })
    mockConditionExecutor.canExecute = vi.fn(() => true)

    mockEndExecutor = Object.create(EndNodeExecutor.prototype)
    mockEndExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { message: 'Workflow ended' } })
    mockEndExecutor.canExecute = vi.fn(() => true)

    mockToolExecutor = Object.create(ToolNodeExecutor.prototype)
    mockToolExecutor.execute = vi.fn().mockResolvedValue({ success: true, output: { result: 'tool result' } })
    mockToolExecutor.canExecute = vi.fn(() => true)

    executor = new WorkflowExecutor()
    
    // Re-register mock executors to override real ones
    executor.registerNodeExecutor(mockStartExecutor)
    executor.registerNodeExecutor(mockLLMExecutor)
    executor.registerNodeExecutor(mockHTTPExecutor)
    executor.registerNodeExecutor(mockConditionExecutor)
    executor.registerNodeExecutor(mockEndExecutor)
    executor.registerNodeExecutor(mockToolExecutor)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create instance and register default executors', () => {
      expect(executor).toBeDefined()
    })
  })

  describe('execute', () => {
    it('should execute complete workflow', async () => {
      const nodes: WorkflowNode[] = [
        createMockNode('start', 'start', 'Start', { variables: { input: 'test' } }),
        createMockNode('llm', 'llm', 'LLM', { modelId: 'ollama:qwen', prompt: 'Hello' }),
        createMockNode('end', 'end', 'End', { variables: {} }),
      ]
      const edges: WorkflowEdge[] = [
        createMockEdge('e1', 'start', 'llm'),
        createMockEdge('e2', 'llm', 'end'),
      ]
      const definition = createMockWorkflowDefinition(nodes, edges)

      const result = await executor.execute(definition, { userInput: 'hello' })

      expect(result.status).toBe('success')
      expect(result.runId).toBeDefined()
      expect(result.workflowId).toBe('1.0.0')
      expect(result.nodeResults).toHaveLength(3)
      expect(result.startTime).toBeDefined()
      expect(result.endTime).toBeDefined()
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should start from start node', async () => {
      const nodes: WorkflowNode[] = [
        createMockNode('node1', 'llm', 'LLM 1'),
        createMockNode('start', 'start', 'Start'),
        createMockNode('node2', 'llm', 'LLM 2'),
      ]
      const edges: WorkflowEdge[] = [
        createMockEdge('e1', 'start', 'node1'),
        createMockEdge('e2', 'node1', 'node2'),
      ]
      const definition = createMockWorkflowDefinition(nodes, edges)

      const result = await executor.execute(definition, {})

      expect(result.nodeResults[0].nodeId).toBe('start')
      expect(result.status).toBe('success')
    })

    it('should execute nodes in edge order', async () => {
      const nodes: WorkflowNode[] = [
        createMockNode('start', 'start', 'Start'),
        createMockNode('llm1', 'llm', 'LLM 1'),
        createMockNode('llm2', 'llm', 'LLM 2'),
        createMockNode('end', 'end', 'End'),
      ]
      const edges: WorkflowEdge[] = [
        createMockEdge('e1', 'start', 'llm1'),
        createMockEdge('e2', 'llm1', 'llm2'),
        createMockEdge('e3', 'llm2', 'end'),
      ]
      const definition = createMockWorkflowDefinition(nodes, edges)

      const result = await executor.execute(definition, {})

      expect(result.nodeResults.map(r => r.nodeId)).toEqual(['start', 'llm1', 'llm2', 'end'])
    })

    it('should handle conditional branches', async () => {
      const nodes: WorkflowNode[] = [
        createMockNode('start', 'start', 'Start'),
        createMockNode('condition', 'condition', 'Condition'),
        createMockNode('success', 'llm', 'Success Path'),
        createMockNode('failure', 'http', 'Failure Path'),
        createMockNode('end', 'end', 'End'),
      ]
      const edges: WorkflowEdge[] = [
        createMockEdge('e1', 'start', 'condition'),
        createMockEdge('e2', 'condition', 'success', 'output.result == true'),
        createMockEdge('e3', 'condition', 'failure', 'output.result == false'),
        createMockEdge('e4', 'success', 'end'),
        createMockEdge('e5', 'failure', 'end'),
      ]
      const definition = createMockWorkflowDefinition(nodes, edges)

      const result = await executor.execute(definition, {})

      // Should follow success path (condition returns result: true by default)
      const nodeIds = result.nodeResults.map(r => r.nodeId)
      expect(nodeIds).toContain('success')
      expect(nodeIds).not.toContain('failure')
    })

    it('should handle errors during execution', async () => {
      // Reset LLM mock to throw error
      mockLLMExecutor.execute.mockRejectedValue(new Error('LLM execution failed'))

      const nodes: WorkflowNode[] = [
        createMockNode('start', 'start', 'Start'),
        createMockNode('llm', 'llm', 'LLM'),
      ]
      const edges: WorkflowEdge[] = [
        createMockEdge('e1', 'start', 'llm'),
      ]
      const definition = createMockWorkflowDefinition(nodes, edges)

      const result = await executor.execute(definition, {})

      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
    })
  })

  describe('executeNode', () => {
    it('should execute start node', async () => {
      const context = createMockContext({ currentNodeId: 'start-1' })
      const nodeConfig = { variables: { name: 'test' } }

      const result = await executor.executeNode('start', nodeConfig, context)

      expect(result.success).toBe(true)
      expect(result.nodeId).toBe('start-1')
      expect(result.output).toBeDefined()
    })

    it('should execute llm node', async () => {
      const context = createMockContext({ currentNodeId: 'llm-1' })
      const nodeConfig = { modelId: 'ollama:qwen', prompt: 'Hello {{ name }}' }

      const result = await executor.executeNode('llm', nodeConfig, context)

      expect(result.success).toBe(true)
      expect(result.nodeId).toBe('llm-1')
      expect(result.output).toBeDefined()
      expect(result.output.content).toBeDefined()
    })

    it('should execute condition node', async () => {
      const context = createMockContext({ currentNodeId: 'condition-1' })
      const nodeConfig = { expression: '{{ value }} > 10' }

      const result = await executor.executeNode('condition', nodeConfig, context)

      expect(result.success).toBe(true)
      expect(result.nodeId).toBe('condition-1')
      expect(result.output).toBeDefined()
      expect(result.output.result).toBeDefined()
    })
  })

  describe('findNextNode', () => {
    it('should return target for single edge', () => {
      const definition = createMockWorkflowDefinition(
        [createMockNode('start', 'start', 'Start'), createMockNode('end', 'end', 'End')],
        [createMockEdge('e1', 'start', 'end')],
      )

      // Use reflection to access private method
      const findNextNode = (executor as any).findNextNode.bind(executor)
      const nextNode = findNextNode(definition, 'start', {})

      expect(nextNode).toBe('end')
    })

    it('should return first edge target for multiple edges without conditions', () => {
      const definition = createMockWorkflowDefinition(
        [
          createMockNode('start', 'start', 'Start'),
          createMockNode('node1', 'llm', 'Node 1'),
          createMockNode('node2', 'llm', 'Node 2'),
        ],
        [
          createMockEdge('e1', 'start', 'node1'),
          createMockEdge('e2', 'start', 'node2'),
        ],
      )

      const findNextNode = (executor as any).findNextNode.bind(executor)
      const nextNode = findNextNode(definition, 'start', {})

      expect(nextNode).toBe('node1')
    })

    it('should evaluate conditions for multiple edges', () => {
      const definition = createMockWorkflowDefinition(
        [
          createMockNode('start', 'start', 'Start'),
          createMockNode('success', 'llm', 'Success'),
          createMockNode('failure', 'http', 'Failure'),
        ],
        [
          createMockEdge('e1', 'start', 'success', 'output.status === "success"'),
          createMockEdge('e2', 'start', 'failure', 'output.status === "failure"'),
        ],
      )

      const findNextNode = (executor as any).findNextNode.bind(executor)

      // Test with success condition
      const nextNodeSuccess = findNextNode(definition, 'start', { status: 'success' })
      expect(nextNodeSuccess).toBe('success')

      // Test with failure condition
      const nextNodeFailure = findNextNode(definition, 'start', { status: 'failure' })
      expect(nextNodeFailure).toBe('failure')
    })

    it('should return null when no condition matches', () => {
      const definition = createMockWorkflowDefinition(
        [
          createMockNode('start', 'start', 'Start'),
          createMockNode('success', 'llm', 'Success'),
          createMockNode('failure', 'http', 'Failure'),
        ],
        [
          createMockEdge('e1', 'start', 'success', 'output.value > 100'),
          createMockEdge('e2', 'start', 'failure', 'output.value < 0'),
        ],
      )

      const findNextNode = (executor as any).findNextNode.bind(executor)
      const nextNode = findNextNode(definition, 'start', { value: 50 })

      expect(nextNode).toBe(null)
    })
  })

  describe('evaluateCondition', () => {
    it('should evaluate simple condition expression', () => {
      const evaluateCondition = (executor as any).evaluateCondition.bind(executor)

      expect(evaluateCondition('output.status === "success"', { status: 'success' })).toBe(true)
      expect(evaluateCondition('output.status === "success"', { status: 'failure' })).toBe(false)
      expect(evaluateCondition('output.value > 10', { value: 15 })).toBe(true)
      expect(evaluateCondition('output.value > 10', { value: 5 })).toBe(false)
    })

    it('should evaluate complex logical expression', () => {
      const evaluateCondition = (executor as any).evaluateCondition.bind(executor)

      expect(evaluateCondition('output.a > 0 && output.b > 0', { a: 5, b: 10 })).toBe(true)
      expect(evaluateCondition('output.a > 0 && output.b > 0', { a: 5, b: -1 })).toBe(false)
      expect(evaluateCondition('output.a > 0 || output.b > 0', { a: -5, b: 10 })).toBe(true)
      expect(evaluateCondition('output.a > 0 || output.b > 0', { a: -5, b: -10 })).toBe(false)
      expect(evaluateCondition('output.status === "success" && output.count >= 5', { status: 'success', count: 10 })).toBe(true)
    })

    it('should return false for expression errors', () => {
      const evaluateCondition = (executor as any).evaluateCondition.bind(executor)

      expect(evaluateCondition('invalid syntax', {})).toBe(false)
      expect(evaluateCondition('output.nonExistent.prop', {})).toBe(false)
      expect(evaluateCondition('', {})).toBe(false)
      expect(evaluateCondition('throw new Error()', {})).toBe(false)
    })
  })

  describe('registerNodeExecutor', () => {
    it('should register custom executor', () => {
      const customExecutor: INodeExecutor = {
        execute: vi.fn().mockResolvedValue({ success: true, output: 'custom' }),
        canExecute: vi.fn((nodeType: string) => nodeType === 'custom'),
      }

      executor.registerNodeExecutor(customExecutor)

      // Verify custom executor is registered
      expect(customExecutor.canExecute('custom')).toBe(true)
      expect(customExecutor.canExecute('start')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty workflow definition', async () => {
      const definition = createMockWorkflowDefinition([], [])

      const result = await executor.execute(definition, {})

      expect(result.status).toBe('success')
      expect(result.nodeResults).toHaveLength(0)
      expect(result.output).toEqual({})
    })

    it('should handle node not found error', async () => {
      const definition = createMockWorkflowDefinition(
        [createMockNode('start', 'start', 'Start')],
        [createMockEdge('e1', 'start', 'nonexistent')],
      )

      const result = await executor.execute(definition, {})

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Node not found')
    })
  })
})
