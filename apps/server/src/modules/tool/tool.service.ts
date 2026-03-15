import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistry } from './tool.registry';
import { HttpTool } from './tools/http-tool';
import { CodeTool } from './tools/code-tool';
import { TimeTool } from './tools/time-tool';
import { ToolExecutionResult } from './tool.interface';

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  constructor(private readonly toolRegistry: ToolRegistry) {
    this.initializeBuiltInTools();
  }

  private initializeBuiltInTools(): void {
    this.toolRegistry.register(new HttpTool());
    this.toolRegistry.register(new CodeTool());
    this.toolRegistry.register(new TimeTool());
    this.logger.log('Built-in tools initialized');
  }

  listTools() {
    return this.toolRegistry.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  getTool(name: string) {
    const tool = this.toolRegistry.get(name);
    if (!tool) {
      return null;
    }
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };
  }

  async executeTool(name: string, params: Record<string, any>): Promise<ToolExecutionResult> {
    this.logger.log(`Executing tool "${name}" with params: ${JSON.stringify(params)}`);
    return this.toolRegistry.execute(name, params);
  }
}
