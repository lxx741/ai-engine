import { JSONSchema7 } from 'json-schema';

export interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema7 | any;
  execute(params: Record<string, any>): Promise<any>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}
