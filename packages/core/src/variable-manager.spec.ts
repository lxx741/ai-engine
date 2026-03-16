import { describe, it, expect } from 'vitest';
import { VariableManager, VariableScope } from './variable-manager';
import { WorkflowExecutionContext } from '@ai-engine/shared';

/**
 * Create a mock WorkflowExecutionContext for testing
 */
function createMockContext(overrides?: Partial<WorkflowExecutionContext>): WorkflowExecutionContext {
  return {
    workflowId: 'test-workflow-123',
    runId: 'test-run-456',
    variables: {},
    nodeOutputs: {},
    currentNodeId: undefined,
    startTime: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('VariableManager', () => {
  describe('constructor', () => {
    it('should create VariableManager instance with system variables initialized', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      expect(manager).toBeDefined();
      // System variables should be set in constructor
      expect(manager.getVariable('__system.workflowId')).toBe('test-workflow-123');
      expect(manager.getVariable('__system.runId')).toBe('test-run-456');
      expect(manager.getVariable('__system.startTime')).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('setVariable', () => {
    it('should set a simple variable in global scope', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      manager.setVariable('username', 'john_doe');

      expect(context.variables.username).toBe('john_doe');
    });

    it('should update an existing variable', () => {
      const context = createMockContext({
        variables: { count: 1 },
      });
      const manager = new VariableManager(context);

      manager.setVariable('count', 100);

      expect(context.variables.count).toBe(100);
    });

    it('should set a nested object using dot notation path', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      manager.setVariable('user.profile.name', 'Alice');
      manager.setVariable('user.profile.age', 30);

      expect(context.variables.user).toEqual({
        profile: {
          name: 'Alice',
          age: 30,
        },
      });
    });
  });

  describe('getVariable', () => {
    it('should get a simple variable', () => {
      const context = createMockContext({
        variables: { message: 'Hello World' },
      });
      const manager = new VariableManager(context);

      const value = manager.getVariable('message');

      expect(value).toBe('Hello World');
    });

    it('should get a nested variable using dot notation path', () => {
      const context = createMockContext({
        variables: {
          user: {
            profile: {
              email: 'user@example.com',
            },
          },
        },
      });
      const manager = new VariableManager(context);

      const value = manager.getVariable('user.profile.email');

      expect(value).toBe('user@example.com');
    });

    it('should return undefined for non-existent variable', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      const value = manager.getVariable('nonExistent');

      expect(value).toBeUndefined();
    });
  });

  describe('setNodeOutput', () => {
    it('should set node output and update context', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      const output = { result: 'success', data: [1, 2, 3] };
      manager.setNodeOutput('node-1', output);

      expect(context.nodeOutputs['node-1']).toEqual(output);
      expect(context.variables.nodes).toBeDefined();
      expect(context.variables.nodes['node-1']).toEqual(output);
    });

    it('should update existing node output', () => {
      const context = createMockContext({
        nodeOutputs: {
          'node-1': { result: 'old' },
        },
      });
      const manager = new VariableManager(context);

      const newOutput = { result: 'new', updated: true };
      manager.setNodeOutput('node-1', newOutput);

      expect(context.nodeOutputs['node-1']).toEqual(newOutput);
      expect(context.variables.nodes['node-1']).toEqual(newOutput);
    });
  });

  describe('getNodeOutput', () => {
    it('should get node output by node ID', () => {
      const context = createMockContext({
        nodeOutputs: {
          'node-1': { status: 'completed', value: 42 },
        },
      });
      const manager = new VariableManager(context);

      const output = manager.getNodeOutput('node-1');

      expect(output).toEqual({ status: 'completed', value: 42 });
    });

    it('should return undefined for non-existent node', () => {
      const context = createMockContext();
      const manager = new VariableManager(context);

      const output = manager.getNodeOutput('non-existent-node');

      expect(output).toBeUndefined();
    });
  });

  describe('getAllVariables', () => {
    it('should return all variables including context variables and node outputs', () => {
      const context = createMockContext({
        variables: {
          globalVar: 'global',
          nested: { key: 'value' },
        },
        nodeOutputs: {
          'node-1': { output: 'result1' },
          'node-2': { output: 'result2' },
        },
      });
      const manager = new VariableManager(context);

      const allVariables = manager.getAllVariables();

      expect(allVariables).toEqual({
        __system: {
          runId: 'test-run-456',
          startTime: '2024-01-01T00:00:00.000Z',
          workflowId: 'test-workflow-123',
        },
        globalVar: 'global',
        nested: { key: 'value' },
        'node-1': { output: 'result1' },
        'node-2': { output: 'result2' },
      });
    });
  });
});
