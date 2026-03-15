import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
import { parseTemplate } from '@ai-engine/shared';

export class ToolNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'tool';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const startTime = Date.now();

      const toolName = config.toolName;
      const rawParams = config.params || {};

      if (!toolName) {
        return {
          success: false,
          error: 'Tool name is required',
        };
      }

      const processedParams: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawParams)) {
        if (typeof value === 'string') {
          processedParams[key] = parseTemplate(value, context.variables);
        } else {
          processedParams[key] = value;
        }
      }

      const response = await fetch(
        `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/tools/${toolName}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(context.apiKey ? { 'X-API-Key': context.apiKey } : {}),
          },
          body: JSON.stringify({
            params: processedParams,
          }),
        }
      );

      const result: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Tool execution failed with status ${response.status}`,
        };
      }

      const duration = Date.now() - startTime;

      return {
        success: result.success,
        output: {
          ...result.data,
          duration,
        },
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
