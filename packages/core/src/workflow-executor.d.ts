import { WorkflowDefinition, WorkflowExecutionResult, NodeExecutionResult, WorkflowRunStatus } from '@ai-engine/shared';
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
    currentNodeId?: string;
    apiKey?: string;
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
    status: WorkflowRunStatus;
    duration: number;
}
export interface IWorkflowExecutor {
    execute(definition: WorkflowDefinition, input: Record<string, any>, config?: WorkflowExecutorConfig): Promise<WorkflowExecutionResult>;
    executeNode(nodeType: string, nodeConfig: any, context: ExecutionContext): Promise<NodeExecutionResult>;
}
export interface INodeExecutor {
    execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult>;
    canExecute(nodeType: string): boolean;
}
export declare class WorkflowExecutor implements IWorkflowExecutor {
    private nodeExecutors;
    private config;
    constructor(config?: WorkflowExecutorConfig);
    registerNodeExecutor(executor: INodeExecutor): void;
    execute(definition: WorkflowDefinition, input: Record<string, any>, config?: WorkflowExecutorConfig): Promise<WorkflowExecutionResult>;
    executeNode(nodeType: string, nodeConfig: any, context: ExecutionContext): Promise<NodeExecutionResult>;
    private executeNodeWithTimeout;
    private findStartNode;
    private findNextNode;
    private evaluateCondition;
    private generateRunId;
    private extractWorkflowId;
    private getNodeTypeFromExecutor;
}
export declare function createWorkflowExecutor(config?: WorkflowExecutorConfig): WorkflowExecutor;
