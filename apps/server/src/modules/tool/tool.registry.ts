import { Injectable, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import { Tool, ToolExecutionResult } from './tool.interface';

@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();
  private readonly ajv = new Ajv();
  private readonly logger = new Logger(ToolRegistry.name);

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
    this.logger.log(`Tool "${tool.name}" registered successfully.`);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(name: string, params: Record<string, any>): Promise<ToolExecutionResult> {
    const tool = this.get(name);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }

    if (tool.parameters) {
      const validate = this.ajv.compile(tool.parameters);
      const valid = validate(params);
      
      if (!valid) {
        return {
          success: false,
          error: `Invalid parameters: ${this.ajv.errorsText(validate.errors)}`,
        };
      }
    }

    try {
      const result = await tool.execute(params);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Tool "${name}" execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }
}
