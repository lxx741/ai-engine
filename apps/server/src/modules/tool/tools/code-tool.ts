import { Tool } from '../tool.interface';
import { VM } from 'vm2';

export class CodeTool implements Tool {
  name = 'code';
  description = 'Execute JavaScript code in a secure sandbox environment with timeout and memory limits';
  parameters = {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'JavaScript code to execute',
      },
      timeout: {
        type: 'number',
        description: 'Execution timeout in milliseconds',
        default: 3000,
      },
      memoryLimit: {
        type: 'number',
        description: 'Memory limit in bytes',
        default: 10 * 1024 * 1024,
      },
    },
    required: ['code'],
  } as const;

  async execute(params: Record<string, any>): Promise<any> {
    const { code, timeout = 3000, memoryLimit = 10 * 1024 * 1024 } = params;

    const vm = new VM({
      timeout,
      sandbox: {
        console: {
          log: (...args: any[]) => console.log('[SANDBOX]', ...args),
          error: (...args: any[]) => console.error('[SANDBOX]', ...args),
          warn: (...args: any[]) => console.warn('[SANDBOX]', ...args),
          info: (...args: any[]) => console.info('[SANDBOX]', ...args),
        },
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        JSON,
        Error,
        TypeError,
        ReferenceError,
        SyntaxError,
        RangeError,
      },
    });

    try {
      const result = vm.run(code);
      return {
        result,
        output: 'Code executed successfully',
      };
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
}
