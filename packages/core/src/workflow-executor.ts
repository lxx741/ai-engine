import { WorkflowDefinition, RunStatus } from '@ai-engine/shared'

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
  status: RunStatus
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
  ): Promise<WorkflowExecuteResult>

  /**
   * Execute a single node
   */
  executeNode(
    nodeType: string,
    nodeConfig: any,
    context: ExecutionContext
  ): Promise<NodeExecuteResult>
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
