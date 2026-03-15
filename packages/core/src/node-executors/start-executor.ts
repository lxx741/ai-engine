import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
import { WorkflowNode } from '@ai-engine/shared';

export class StartNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'start';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const variables = config.variables || {};
      
      context.variables = {
        ...context.variables,
        ...variables,
      };

      return {
        success: true,
        output: {
          message: 'Workflow started',
          variables,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
