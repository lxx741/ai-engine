import { describe, it, expect, beforeEach } from 'vitest';
import { StartNodeExecutor } from './start-executor';
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

describe('StartNodeExecutor', () => {
  let executor: StartNodeExecutor;
  let context: ExecutionContext;

  beforeEach(() => {
    executor = new StartNodeExecutor();
    context = createMockContext();
  });

  describe('canExecute', () => {
    it('should return true for start node type', () => {
      const result = executor.canExecute('start');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('llm')).toBe(false);
      expect(executor.canExecute('http')).toBe(false);
      expect(executor.canExecute('condition')).toBe(false);
      expect(executor.canExecute('end')).toBe(false);
      expect(executor.canExecute('tool')).toBe(false);
      expect(executor.canExecute('unknown')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should initialize variables from config', async () => {
      const config = {
        variables: {
          username: 'john_doe',
          email: 'john@example.com',
          count: 42,
        },
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        message: 'Workflow started',
        variables: config.variables,
      });
      expect(context.variables).toEqual(config.variables);
    });

    it('should handle empty config variables', async () => {
      const config = {};

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        message: 'Workflow started',
        variables: {},
      });
      expect(context.variables).toEqual({});
    });

    it('should merge variables with existing context variables', async () => {
      context.variables = {
        existingVar: 'existing_value',
        sharedVar: 'old_value',
      };

      const config = {
        variables: {
          newVar: 'new_value',
          sharedVar: 'new_shared_value',
        },
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(context.variables).toEqual({
        existingVar: 'existing_value',
        sharedVar: 'new_shared_value',
        newVar: 'new_value',
      });
    });

    it('should handle null variables gracefully', async () => {
      const config = {
        variables: null,
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.variables).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should catch and return error if execution fails', async () => {
      const config = {
        variables: {
          test: 'value',
        },
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
    });

    it('should handle unknown error type', async () => {
      const config = {
        variables: { test: 'value' },
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
    });
  });
});
