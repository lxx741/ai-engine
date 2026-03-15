import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
import { parseTemplate } from '@ai-engine/shared';

export class HTTPNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'http';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const startTime = Date.now();
      
      const urlTemplate = config.url || '';
      const url = parseTemplate(urlTemplate, context.variables);
      
      let body: string | undefined;
      if (config.body) {
        body = parseTemplate(config.body, context.variables);
      }
      
      const headers: Record<string, string> = {};
      if (config.headers) {
        for (const [key, value] of Object.entries(config.headers)) {
          headers[key] = parseTemplate(value as string, context.variables);
        }
      }
      
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers,
        body: config.method !== 'GET' ? body : undefined,
      });
      
      const responseData = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: response.ok,
        output: {
          status: response.status,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          duration,
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
