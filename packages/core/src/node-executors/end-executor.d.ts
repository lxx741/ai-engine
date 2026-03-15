import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
export declare class EndNodeExecutor implements INodeExecutor {
    canExecute(nodeType: string): boolean;
    execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult>;
}
