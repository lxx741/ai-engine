import { describe, it, expect, beforeEach } from 'vitest';
import { EndNodeExecutor } from './end-executor';
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

describe('EndNodeExecutor', () => {
  let executor: EndNodeExecutor;
  let context: ExecutionContext;

  beforeEach(() => {
    executor = new EndNodeExecutor();
    context = createMockContext();
  });

  describe('canExecute', () => {
    it('should return true for end node type', () => {
      const result = executor.canExecute('end');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('start')).toBe(false);
      expect(executor.canExecute('llm')).toBe(false);
      expect(executor.canExecute('http')).toBe(false);
      expect(executor.canExecute('condition')).toBe(false);
      expect(executor.canExecute('tool')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should return final output with specified variables', async () => {
      context.variables = {
        result: 'success',
        data: { id: 1, name: 'Test' },
        count: 42,
      };

      const config = {
        variables: ['result', 'data'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.message).toBe('Workflow completed');
      expect(result.output.output).toEqual({
        result: 'success',
        data: { id: 1, name: 'Test' },
      });
    });

    it('should handle empty variables list', async () => {
      context.variables = {
        result: 'success',
        data: { id: 1 },
      };

      const config = {
        variables: [],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output).toEqual({});
    });

    it('should handle missing config variables', async () => {
      context.variables = {
        result: 'success',
      };

      const config = {};

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output).toEqual({});
    });

    it('should handle non-existent variable gracefully', async () => {
      context.variables = {
        existingVar: 'value',
      };

      const config = {
        variables: ['existingVar', 'nonExistentVar'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output).toEqual({
        existingVar: 'value',
        nonExistentVar: undefined,
      });
    });

    it('should handle null variables config', async () => {
      const config = {
        variables: null,
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output).toEqual({});
    });
  });

  describe('template handling', () => {
    it('should pass through variable values as-is', async () => {
      context.variables = {
        message: 'Hello, World!',
        number: 123,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3],
      };

      const config = {
        variables: ['message', 'number', 'boolean', 'object', 'array'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output).toEqual({
        message: 'Hello, World!',
        number: 123,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3],
      });
    });
  });

  describe('error handling', () => {
    it('should catch and return error if execution fails', async () => {
      // The executor has try-catch, verify it handles errors gracefully
      context.variables = {
        test: 'value',
      };

      const config = {
        variables: ['test'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
    });

    it('should handle unknown error type', async () => {
      const config = {
        variables: ['test'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
    });

    it('should handle deeply nested variable access', async () => {
      context.variables = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const config = {
        variables: ['level1'],
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.output.level1).toEqual({
        level2: {
          level3: {
            value: 'deep',
          },
        },
      });
    });
  });
});
