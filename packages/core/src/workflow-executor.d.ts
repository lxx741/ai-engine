import { WorkflowDefinition, RunStatus } from '@ai-engine/shared';
export interface WorkflowExecutorConfig {
    timeout?: number;
    maxRetries?: number;
}
export interface ExecutionContext {
    workflowId: string;
    runId: string;
    variables: Record<string, any>;
    nodeOutputs: Record<string, any>;
    startTime: Date;
}
export interface NodeExecuteResult {
    success: boolean;
    output?: any;
    error?: string;
}
export interface WorkflowExecuteResult {
    success: boolean;
    output?: any;
    error?: string;
    status: RunStatus;
    duration: number;
}
export interface IWorkflowExecutor {
    execute(definition: WorkflowDefinition, input: Record<string, any>, config?: WorkflowExecutorConfig): Promise<WorkflowExecuteResult>;
    executeNode(nodeType: string, nodeConfig: any, context: ExecutionContext): Promise<NodeExecuteResult>;
}
export interface INodeExecutor {
    execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult>;
    canExecute(nodeType: string): boolean;
}
