import { WorkflowDefinition, WorkflowExecutionResult, NodeExecutionResult, WorkflowRunStatus, WorkflowNode } from '@ai-engine/shared'
import { VariableManager, VariableScope } from './variable-manager'
import { TemplateHelper } from './template-helper'
import {
  StartNodeExecutor,
  LLMNodeExecutor,
  HTTPNodeExecutor,
  ConditionNodeExecutor,
  EndNodeExecutor,
  ToolNodeExecutor,
} from './node-executors'

export interface WorkflowExecutorConfig {
  timeout?: number // milliseconds
  maxRetries?: number
}

export interface ExecutionContext {
  workflowId: string
  runId: string
  variables: Record<string, any>
  nodeOutputs: Record<string, any>
  startTime: Date
  currentNodeId?: string
  apiKey?: string
}

export interface NodeExecuteResult {
  success: boolean
  output?: any
  error?: string
}

export interface WorkflowExecuteResult {
  success: boolean
  output?: any
  error?: string
  status: WorkflowRunStatus
  duration: number
}

/**
 * Workflow Executor Interface
 */
export interface IWorkflowExecutor {
  /**
   * Execute a workflow
   */
  execute(
    definition: WorkflowDefinition,
    input: Record<string, any>,
    config?: WorkflowExecutorConfig
  ): Promise<WorkflowExecutionResult>

  /**
   * Execute a single node
   */
  executeNode(
    nodeType: string,
    nodeConfig: any,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>
}

/**
 * Node Executor Interface
 */
export interface INodeExecutor {
  /**
   * Execute the node
   */
  execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult>

  /**
   * Check if this executor can handle the node type
   */
  canExecute(nodeType: string): boolean
}

// ============================================
// Implementation
// ============================================

/**
 * Default workflow executor implementation
 */
export class WorkflowExecutor implements IWorkflowExecutor {
  private nodeExecutors: Map<string, INodeExecutor> = new Map()
  private config: WorkflowExecutorConfig

  constructor(config?: WorkflowExecutorConfig) {
    this.config = {
      timeout: 300000, // 5 minutes default
      maxRetries: 2,
      ...config,
    }

    // Register default node executors
    this.registerNodeExecutor(new StartNodeExecutor())
    this.registerNodeExecutor(new LLMNodeExecutor())
    this.registerNodeExecutor(new HTTPNodeExecutor())
    this.registerNodeExecutor(new ConditionNodeExecutor())
    this.registerNodeExecutor(new EndNodeExecutor())
    this.registerNodeExecutor(new ToolNodeExecutor())
  }

  /**
   * Register a node executor
   */
  registerNodeExecutor(executor: INodeExecutor): void {
    const nodeType = this.getNodeTypeFromExecutor(executor)
    this.nodeExecutors.set(nodeType, executor)
  }

  /**
   * Execute a workflow
   */
  async execute(
    definition: WorkflowDefinition,
    input: Record<string, any>,
    config?: WorkflowExecutorConfig
  ): Promise<WorkflowExecutionResult> {
    const mergedConfig = { ...this.config, ...config }
    const runId = this.generateRunId()
    const startTime = new Date()

    // Create execution context
    const context: ExecutionContext = {
      workflowId: this.extractWorkflowId(definition),
      runId,
      variables: { ...input, ...definition.variables },
      nodeOutputs: {},
      startTime,
    }

    const variableManager = new VariableManager(context)
    const templateHelper = new TemplateHelper(variableManager)

    const nodeResults: NodeExecutionResult[] = []
    let currentNodeId: string | null = this.findStartNode(definition)
    let status: WorkflowRunStatus = 'running'
    let error: string | undefined

    try {
      // Execute nodes in topological order
      while (currentNodeId && status === 'running') {
        context.currentNodeId = currentNodeId

        const node = definition.nodes.find(n => n.id === currentNodeId)
        if (!node) {
          throw new Error(`Node not found: ${currentNodeId}`)
        }

        // Execute node with timeout
        const nodeResult = await this.executeNodeWithTimeout(
          node,
          context,
          templateHelper,
          mergedConfig,
        )

        nodeResults.push(nodeResult)

        if (!nodeResult.success) {
          status = 'failed'
          error = nodeResult.error
          break
        }

        // Store node output
        variableManager.setNodeOutput(node.id, nodeResult.output)

        // Find next node
        currentNodeId = this.findNextNode(definition, node.id, nodeResult.output)
      }

      if (status === 'running') {
        status = 'success'
      }
    } catch (err) {
      status = 'failed'
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    return {
      runId,
      workflowId: context.workflowId,
      status,
      output: context.nodeOutputs,
      error,
      nodeResults,
      duration,
      startTime,
      endTime,
    }
  }

  /**
   * Execute a single node
   */
  async executeNode(
    nodeType: string,
    nodeConfig: any,
    context: ExecutionContext,
  ): Promise<NodeExecutionResult> {
    const executor = this.nodeExecutors.get(nodeType)
    if (!executor) {
      throw new Error(`No executor found for node type: ${nodeType}`)
    }

    const startTime = Date.now()

    try {
      const output = await executor.execute(nodeConfig, context)
      const duration = Date.now() - startTime

      return {
        nodeId: context.currentNodeId || 'unknown',
        success: output.success,
        output: output.output,
        error: output.error,
        duration,
        timestamp: new Date(),
      }
    } catch (err) {
      return {
        nodeId: context.currentNodeId || 'unknown',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Execute node with timeout
   */
  private async executeNodeWithTimeout(
    node: WorkflowNode,
    context: ExecutionContext,
    templateHelper: TemplateHelper,
    config: WorkflowExecutorConfig,
  ): Promise<NodeExecutionResult> {
    const timeout = node.config.timeout || config.timeout || 300000

    const timeoutPromise = new Promise<NodeExecutionResult>((_, reject) => {
      setTimeout(() => reject(new Error(`Node execution timeout: ${timeout}ms`)), timeout)
    })

    const executionPromise = this.executeNode(node.type, node.config, context)

    return Promise.race([executionPromise, timeoutPromise])
  }

  /**
   * Find start node
   */
  private findStartNode(definition: WorkflowDefinition): string | null {
    const startNode = definition.nodes.find(n => n.type === 'start')
    return startNode ? startNode.id : null
  }

  /**
   * Find next node based on edges
   */
  private findNextNode(
    definition: WorkflowDefinition,
    currentNodeId: string,
    nodeOutput: any,
  ): string | null {
    // Find edges from current node
    const edges = definition.edges.filter(e => e.source === currentNodeId)

    if (edges.length === 0) {
      return null // No outgoing edges
    }

    if (edges.length === 1) {
      return edges[0].target // Single edge, follow it
    }

    // Multiple edges - evaluate conditions
    for (const edge of edges) {
      if (!edge.condition) {
        return edge.target // Default edge (no condition)
      }

      // Evaluate condition
      try {
        const conditionResult = this.evaluateCondition(edge.condition, nodeOutput)
        if (conditionResult) {
          return edge.target
        }
      } catch {
        // Condition evaluation failed, try next edge
      }
    }

    return null // No matching edge
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, nodeOutput: any): boolean {
    // Simple condition evaluation
    // Support: result == 'success', output.value > 10, etc.
    try {
      const func = new Function('output', 'return ' + condition)
      return !!func(nodeOutput)
    } catch {
      return false
    }
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Extract workflow ID from definition
   */
  private extractWorkflowId(definition: WorkflowDefinition): string {
    return definition.metadata?.version || 'workflow'
  }

  /**
   * Get node type from executor (reflection)
   */
  private getNodeTypeFromExecutor(executor: INodeExecutor): string {
    // Simple heuristic based on class name
    const className = executor.constructor.name
    if (className.includes('Start')) return 'start'
    if (className.includes('LLM')) return 'llm'
    if (className.includes('HTTP')) return 'http'
    if (className.includes('Condition')) return 'condition'
    if (className.includes('End')) return 'end'
    if (className.includes('Tool')) return 'tool'
    return 'unknown'
  }
}

/**
 * Create workflow executor instance
 */
export function createWorkflowExecutor(config?: WorkflowExecutorConfig): WorkflowExecutor {
  return new WorkflowExecutor(config)
}
