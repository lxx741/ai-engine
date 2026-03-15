import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';

export class EndNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'end';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const outputVariables = config.variables || [];
      const output: Record<string, any> = {};
      
      for (const varName of outputVariables) {
        output[varName] = context.variables[varName];
      }

      return {
        success: true,
        output: {
          message: 'Workflow completed',
          output,
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
