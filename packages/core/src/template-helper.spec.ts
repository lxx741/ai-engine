import { describe, it, expect, vi } from 'vitest';
import { TemplateHelper } from './template-helper';
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

/**
 * Create a VariableManager instance with the given context
 */
function createVariableManager(context: WorkflowExecutionContext): VariableManager {
  return new VariableManager(context);
}

/**
 * Create a TemplateHelper instance with the given variable manager
 */
function createTemplateHelper(variableManager: VariableManager): TemplateHelper {
  return new TemplateHelper(variableManager);
}

describe('TemplateHelper', () => {
  describe('parse', () => {
    it('should parse simple template string without variables', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Hello World!';
      const result = helper.parse(template);

      expect(result).toBe('Hello World!');
    });

    it('should parse template with simple variable reference', () => {
      const context = createMockContext({
        variables: {
          userName: 'Alice',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Hello, {{ userName }}!';
      const result = helper.parse(template);

      expect(result).toBe('Hello, Alice!');
    });

    it('should parse template with node output reference using nodes prefix', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      
      // Use node ID without hyphens (hyphens are interpreted as minus in expressions)
      variableManager.setNodeOutput('node1', {
        output: 'Result from node1',
      });
      
      const helper = createTemplateHelper(variableManager);

      const template = 'Node output: {{ nodes.node1.output }}';
      const result = helper.parse(template);

      expect(result).toBe('Node output: Result from node1');
    });

    it('should parse template with nested path reference', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      
      // Use setNodeOutput to properly set up nested structure
      variableManager.setNodeOutput('node1', {
        data: {
          value: 'Nested value',
          count: 42,
        },
      });
      
      const helper = createTemplateHelper(variableManager);

      const template = 'Value: {{ nodes.node1.data.value }}, Count: {{ nodes.node1.data.count }}';
      const result = helper.parse(template);

      expect(result).toBe('Value: Nested value, Count: 42');
    });

    it('should parse template with multiple mixed variables', () => {
      const context = createMockContext({
        variables: {
          greeting: 'Hello',
          user: {
            name: 'Bob',
            email: 'bob@example.com',
          },
        },
      });
      const variableManager = createVariableManager(context);
      
      // Set node output using the proper method
      variableManager.setNodeOutput('llmNode', {
        response: 'AI response',
      });
      
      const helper = createTemplateHelper(variableManager);

      const template = '{{ greeting }}, {{ user.name }}! Your email is {{ user.email }}. AI says: {{ nodes.llmNode.response }}';
      const result = helper.parse(template);

      expect(result).toBe('Hello, Bob! Your email is bob@example.com. AI says: AI response');
    });
  });

  describe('parseObject', () => {
    it('should parse object with template string values', () => {
      const context = createMockContext({
        variables: {
          name: 'Charlie',
          role: 'Developer',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const obj = {
        title: 'User: {{ name }}',
        description: 'Role: {{ role }}',
        constant: 'This is static',
      };
      const result = helper.parseObject(obj);

      expect(result).toEqual({
        title: 'User: Charlie',
        description: 'Role: Developer',
        constant: 'This is static',
      });
    });

    it('should parse nested object with template string values', () => {
      const context = createMockContext({
        variables: {
          firstName: 'David',
          lastName: 'Smith',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const obj = {
        user: {
          fullName: '{{ firstName }} {{ lastName }}',
          profile: {
            displayName: 'User: {{ firstName }}',
          },
        },
        meta: {
          version: '1.0',
        },
      };
      const result = helper.parseObject(obj);

      expect(result).toEqual({
        user: {
          fullName: 'David Smith',
          profile: {
            displayName: 'User: David',
          },
        },
        meta: {
          version: '1.0',
        },
      });
    });

    it('should handle object with non-string values (preserves non-string types)', () => {
      const context = createMockContext({
        variables: {
          value: 'test',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const obj = {
        stringVal: '{{ value }}',
        numberVal: 42,
        booleanVal: true,
        nullVal: null,
      };
      const result = helper.parseObject(obj);

      expect(result).toEqual({
        stringVal: 'test',
        numberVal: 42,
        booleanVal: true,
        nullVal: null,
      });
    });
  });

  describe('parseArray', () => {
    it('should parse array with template string items', () => {
      const context = createMockContext({
        variables: {
          item1: 'First',
          item2: 'Second',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const arr = ['{{ item1 }}', '{{ item2 }}', 'Static item'];
      const result = helper.parseArray(arr);

      expect(result).toEqual(['First', 'Second', 'Static item']);
    });

    it('should parse array with object items containing templates', () => {
      const context = createMockContext({
        variables: {
          name: 'Eve',
          status: 'active',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const arr = [
        { label: 'Name: {{ name }}', value: 1 },
        { label: 'Status: {{ status }}', value: 2 },
      ];
      const result = helper.parseArray(arr);

      expect(result).toEqual([
        { label: 'Name: Eve', value: 1 },
        { label: 'Status: active', value: 2 },
      ]);
    });

    it('should handle array with mixed types', () => {
      const context = createMockContext({
        variables: {
          text: 'dynamic',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const arr = ['{{ text }}', 123, true, null, { nested: '{{ text }}' }];
      const result = helper.parseArray(arr);

      expect(result).toEqual(['dynamic', 123, true, null, { nested: 'dynamic' }]);
    });
  });

  describe('expression evaluation', () => {
    it('should evaluate simple expression', () => {
      const context = createMockContext({
        variables: {
          count: 10,
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Count is {{ count }}';
      const result = helper.parse(template);

      expect(result).toBe('Count is 10');
    });

    it('should evaluate expression with logical OR operator', () => {
      const context = createMockContext({
        variables: {
          name: '',
          defaultName: 'Guest',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Hello, {{ name || defaultName }}!';
      const result = helper.parse(template);

      expect(result).toBe('Hello, Guest!');
    });

    it('should evaluate expression with logical AND operator', () => {
      const context = createMockContext({
        variables: {
          isAdmin: true,
          user: { name: 'Admin' },
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = '{{ isAdmin && user.name }}';
      const result = helper.parse(template);

      expect(result).toBe('Admin');
    });

    it('should evaluate expression with ternary operator', () => {
      const context = createMockContext({
        variables: {
          isLoggedIn: true,
          loggedInMessage: 'Welcome back!',
          loggedOutMessage: 'Please log in.',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = '{{ isLoggedIn ? loggedInMessage : loggedOutMessage }}';
      const result = helper.parse(template);

      expect(result).toBe('Welcome back!');
    });

    it('should evaluate ternary operator with false condition', () => {
      const context = createMockContext({
        variables: {
          isLoggedIn: false,
          loggedInMessage: 'Welcome back!',
          loggedOutMessage: 'Please log in.',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Message: {{ isLoggedIn ? loggedInMessage : loggedOutMessage }}';
      const result = helper.parse(template);

      expect(result).toBe('Message: Please log in.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty template', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = '';
      const result = helper.parse(template);

      expect(result).toBe('');
    });

    it('should handle template with only whitespace', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = '   \n\t  ';
      const result = helper.parse(template);

      expect(result).toBe('   \n\t  ');
    });

    it('should handle invalid expression gracefully (non-strict mode)', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Value: {{ nonExistentVariable.prop }}';
      const result = helper.parse(template);

      // In non-strict mode, invalid expressions should remain unchanged
      expect(result).toBe('Value: {{ nonExistentVariable.prop }}');
    });

    it('should handle null variable value (remains unchanged in non-strict mode)', () => {
      const context = createMockContext({
        variables: {
          nullValue: null,
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Null: {{ nullValue }}';
      const result = helper.parse(template);

      // In non-strict mode, null values remain as template placeholder
      expect(result).toBe('Null: {{ nullValue }}');
    });

    it('should handle undefined variable value', () => {
      const context = createMockContext();
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Undefined: {{ undefinedVar }}';
      const result = helper.parse(template);

      // Undefined variables should remain unchanged in non-strict mode
      expect(result).toBe('Undefined: {{ undefinedVar }}');
    });

    it('should handle object variable by converting to JSON string', () => {
      const context = createMockContext({
        variables: {
          userObj: { name: 'Frank', age: 35 },
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'User: {{ userObj }}';
      const result = helper.parse(template);

      expect(result).toBe('User: {"name":"Frank","age":35}');
    });

    it('should handle template with unclosed braces (should not replace)', () => {
      const context = createMockContext({
        variables: {
          name: 'Grace',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = 'Hello {{ name';
      const result = helper.parse(template);

      // Unclosed braces should not be processed
      expect(result).toBe('Hello {{ name');
    });

    it('should handle multiple references to same variable', () => {
      const context = createMockContext({
        variables: {
          name: 'Henry',
        },
      });
      const variableManager = createVariableManager(context);
      const helper = createTemplateHelper(variableManager);

      const template = '{{ name }} - {{ name }} - {{ name }}';
      const result = helper.parse(template);

      expect(result).toBe('Henry - Henry - Henry');
    });
  });
});
