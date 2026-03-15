import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
export declare class ToolNodeExecutor implements INodeExecutor {
    canExecute(nodeType: string): boolean;
    execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult>;
}
