import { describe, it, expect, beforeEach } from 'vitest';
import { ConditionNodeExecutor } from './condition-executor';
import { ExecutionContext } from '../workflow-executor';

/**
 * Create a mock ExecutionContext for testing
 */
function createMockContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    workflowId: 'test-workflow-123',
    runId: 'test-run-456',
    variables: {},
    nodeOutputs: {},
    startTime: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('ConditionNodeExecutor', () => {
  let executor: ConditionNodeExecutor;
  let context: ExecutionContext;

  beforeEach(() => {
    executor = new ConditionNodeExecutor();
    context = createMockContext();
  });

  describe('canExecute', () => {
    it('should return true for condition node type', () => {
      const result = executor.canExecute('condition');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('start')).toBe(false);
      expect(executor.canExecute('llm')).toBe(false);
      expect(executor.canExecute('http')).toBe(false);
      expect(executor.canExecute('end')).toBe(false);
      expect(executor.canExecute('tool')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should evaluate truthy condition', async () => {
      const config = {
        expression: 'true',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
      expect(result.output.expression).toBe('true');
    });

    it('should evaluate falsy condition', async () => {
      const config = {
        expression: 'false',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(false);
    });

    it('should evaluate expression with variables', async () => {
      context.variables = {
        count: 10,
        threshold: 5,
      };

      const config = {
        expression: '{{count}} > {{threshold}}',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should evaluate complex expression', async () => {
      context.variables = {
        age: 25,
        hasLicense: true,
        points: 100,
      };

      const config = {
        expression: '{{age}} >= 18 && {{hasLicense}} && {{points}} > 50',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle variable reference with string value', async () => {
      context.variables = {
        status: 'active',
      };

      const config = {
        expression: '{{status}} == "active"',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle node output reference using nodes prefix', async () => {
      context.variables = {
        nodes: {
          'node-1': { score: 85 },
        },
      };

      const config = {
        expression: '{{nodes.node-1.score}} >= 80',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle nested variable reference', async () => {
      context.variables = {
        user: {
          profile: {
            age: 30,
          },
        },
      };

      const config = {
        expression: '{{user.profile.age}} >= 18',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle numeric comparison', async () => {
      context.variables = {
        price: 99.99,
        budget: 100,
      };

      const config = {
        expression: '{{price}} <= {{budget}}',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle OR expression', async () => {
      context.variables = {
        isAdmin: false,
        isOwner: true,
      };

      const config = {
        expression: '{{isAdmin}} || {{isOwner}}',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle AND expression with all false', async () => {
      context.variables = {
        condition1: false,
        condition2: false,
      };

      const config = {
        expression: '{{condition1}} && {{condition2}}',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(false);
    });
  });

  describe('expression syntax error handling', () => {
    it('should handle syntax error gracefully', async () => {
      const config = {
        expression: 'invalid syntax {{{{',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      // Syntax errors are caught and return false
      expect(result.output.result).toBe(false);
    });

    it('should handle expression that evaluates to a number', async () => {
      const config = {
        expression: '1 + 2',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      // Non-boolean results are truthy in JavaScript
      expect(result.output.result).toBe(3);
    });
  });

  describe('empty expression handling', () => {
    it('should handle empty expression returning undefined', async () => {
      const config = {
        expression: '',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      // Empty expression results in undefined (falsy)
      expect(result.output.result).toBeUndefined();
    });

    it('should handle missing expression', async () => {
      const config = {};

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.expression).toBe('');
      expect(result.output.result).toBeUndefined();
    });
  });

  describe('type conversion', () => {
    it('should handle string to number comparison', async () => {
      context.variables = {
        count: '10',
      };

      const config = {
        expression: '{{count}} == "10"',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle boolean string comparison', async () => {
      context.variables = {
        enabled: 'true',
      };

      const config = {
        expression: '{{enabled}} == "true"',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle null value', async () => {
      context.variables = {
        nullable: null,
      };

      const config = {
        expression: '{{nullable}} == null',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });

    it('should handle undefined variable', async () => {
      const config = {
        expression: '{{nonExistent}} === undefined',
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should catch and return error if execution fails', async () => {
      const config = {
        expression: 'throw new Error("Test error")',
      };

      // The executor has try-catch, should handle gracefully
      const result = await executor.execute(config, context);

      // Expression evaluation errors are caught internally and return false
      expect(result.success).toBe(true);
      expect(result.output.result).toBe(false);
    });
  });
});
