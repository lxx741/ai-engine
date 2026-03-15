import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';

export class ConditionNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'condition';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const expression = config.expression || '';
      
      const result = this.evaluateExpression(expression, context.variables);

      return {
        success: true,
        output: {
          result,
          expression,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private evaluateExpression(expression: string, variables: Record<string, any>): boolean {
    try {
      const evaluated = expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
        const value = this.getNestedValue(variables, key.trim());
        return JSON.stringify(value);
      });
      
      return new Function('return ' + evaluated)();
    } catch {
      return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
