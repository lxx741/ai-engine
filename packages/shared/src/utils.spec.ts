import { describe, it, expect } from 'vitest';
import { parseTemplate, getNestedValue } from './utils';

describe('parseTemplate', () => {
  describe('simple variable replacement', () => {
    it('should replace simple variable with value', () => {
      const template = 'Hello, {{ name }}!';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hello, World!');
    });

    it('should replace multiple simple variables', () => {
      const template = '{{ greeting }}, {{ name }}!';
      const variables = { greeting: 'Hi', name: 'Alice' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hi, Alice!');
    });
  });

  describe('nested variable replacement', () => {
    it('should replace nested variable with value', () => {
      const template = 'User: {{ user.name }}';
      const variables = { user: { name: 'John' } };
      const result = parseTemplate(template, variables);
      expect(result).toBe('User: John');
    });

    it('should replace deeply nested variable', () => {
      const template = 'Email: {{ user.profile.email }}';
      const variables = { user: { profile: { email: 'john@example.com' } } };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Email: john@example.com');
    });
  });

  describe('node output reference', () => {
    it('should replace node output reference', () => {
      const template = 'Result: {{ nodes.nodeId.output }}';
      const variables = { nodes: { nodeId: { output: 'success' } } };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Result: success');
    });

    it('should handle complex node output structure', () => {
      const template = 'Data: {{ nodes.step1.result.data }}';
      const variables = { nodes: { step1: { result: { data: 'value123' } } } };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Data: value123');
    });
  });

  describe('expression evaluation', () => {
    it('should evaluate OR expression with truthy value', () => {
      const template = 'Value: {{ name || "default" }}';
      const variables = { name: 'Alice' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Value: Alice');
    });

    it('should evaluate OR expression with falsy value', () => {
      const template = 'Value: {{ name || "default" }}';
      const variables = { name: '' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Value: default');
    });

    it('should evaluate OR expression with undefined value', () => {
      const template = 'Value: {{ name || "default" }}';
      const variables = {};
      const result = parseTemplate(template, variables);
      expect(result).toBe('Value: {{ name || "default" }}');
    });

    it('should evaluate AND expression', () => {
      const template = 'Result: {{ enabled && "active" }}';
      const variables = { enabled: true };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Result: active');
    });

    it('should evaluate ternary expression', () => {
      const template = 'Status: {{ count > 0 ? "positive" : "zero" }}';
      const variables = { count: 5 };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Status: positive');
    });
  });

  describe('HTML escape option', () => {
    it('should escape HTML entities when escapeHtml is true', () => {
      const template = 'Content: {{ content }}';
      const variables = { content: '<script>alert("XSS")</script>' };
      const result = parseTemplate(template, variables, { escapeHtml: true });
      expect(result).toBe('Content: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should not escape HTML entities when escapeHtml is false', () => {
      const template = 'Content: {{ content }}';
      const variables = { content: '<script>alert("XSS")</script>' };
      const result = parseTemplate(template, variables, { escapeHtml: false });
      expect(result).toBe('Content: <script>alert("XSS")</script>');
    });

    it('should escape ampersand and quotes', () => {
      const template = 'Text: {{ text }}';
      const variables = { text: 'Tom & Jerry\'s "adventure"' };
      const result = parseTemplate(template, variables, { escapeHtml: true });
      expect(result).toBe('Text: Tom &amp; Jerry&#39;s &quot;adventure&quot;');
    });

    it('should escape greater than symbol', () => {
      const template = 'Code: {{ code }}';
      const variables = { code: 'a > b && b < c' };
      const result = parseTemplate(template, variables, { escapeHtml: true });
      expect(result).toBe('Code: a &gt; b &amp;&amp; b &lt; c');
    });
  });

  describe('strict mode', () => {
    it('should throw error when variable not found in strict mode', () => {
      const template = 'Hello, {{ name }}!';
      const variables = {};
      expect(() => parseTemplate(template, variables, { strict: true })).toThrow(
        'Variable not found: name'
      );
    });

    it('should throw error for nested variable not found in strict mode', () => {
      const template = 'User: {{ user.name }}';
      const variables = { user: {} };
      expect(() => parseTemplate(template, variables, { strict: true })).toThrow(
        'Variable not found: user.name'
      );
    });

    it('should not throw error when variable exists in strict mode', () => {
      const template = 'Hello, {{ name }}!';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables, { strict: true });
      expect(result).toBe('Hello, World!');
    });
  });

  describe('error handling', () => {
    it('should keep original template when variable not found in non-strict mode', () => {
      const template = 'Hello, {{ name }}!';
      const variables = {};
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hello, {{ name }}!');
    });

    it('should keep original template for nested variable not found', () => {
      const template = 'User: {{ user.name }}';
      const variables = { user: {} };
      const result = parseTemplate(template, variables);
      expect(result).toBe('User: {{ user.name }}');
    });

    it('should handle expression evaluation errors gracefully', () => {
      const template = 'Result: {{ invalid.syntax!! }}';
      const variables = {};
      const result = parseTemplate(template, variables);
      expect(result).toBe('Result: {{ invalid.syntax!! }}');
    });

    it('should handle expression errors in strict mode', () => {
      const template = 'Result: {{ invalid.syntax!! }}';
      const variables = {};
      expect(() => parseTemplate(template, variables, { strict: true })).toThrow();
    });

    it('should keep original template when catch block is triggered in non-strict mode', () => {
      const template = 'Result: {{ undefinedVar.prop }}';
      const variables = {};
      const result = parseTemplate(template, variables);
      expect(result).toBe('Result: {{ undefinedVar.prop }}');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string template', () => {
      const template = '';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('');
    });

    it('should handle template without variables', () => {
      const template = 'Hello, World!';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hello, World!');
    });

    it('should handle special characters in variable values', () => {
      const template = 'Message: {{ message }}';
      const variables = { message: 'Hello\nWorld\t!' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Message: Hello\nWorld\t!');
    });

    it('should handle unicode characters', () => {
      const template = 'Greeting: {{ greeting }}';
      const variables = { greeting: '你好，世界！🌍' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Greeting: 你好，世界！🌍');
    });

    it('should handle object values by stringifying', () => {
      const template = 'Data: {{ data }}';
      const variables = { data: { key: 'value', num: 123 } };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Data: {"key":"value","num":123}');
    });

    it('should handle array values by stringifying', () => {
      const template = 'List: {{ list }}';
      const variables = { list: [1, 2, 3] };
      const result = parseTemplate(template, variables);
      expect(result).toBe('List: [1,2,3]');
    });

    it('should handle null values', () => {
      const template = 'Value: {{ value }}';
      const variables = { value: null };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Value: {{ value }}');
    });

    it('should handle whitespace in template syntax', () => {
      const template = 'Hello, {{  name  }}!';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hello, World!');
    });

    it('should handle multiple spaces between braces', () => {
      const template = 'Hello, {{   name   }}!';
      const variables = { name: 'World' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Hello, World!');
    });

    it('should handle nested template syntax in variable values', () => {
      const template = 'Value: {{ content }}';
      const variables = { content: 'text with {{ placeholder }} inside' };
      const result = parseTemplate(template, variables);
      expect(result).toBe('Value: text with {{ placeholder }} inside');
    });
  });
});

describe('getNestedValue', () => {
  describe('single level path access', () => {
    it('should get value from single level path', () => {
      const obj = { name: 'John' };
      const result = getNestedValue(obj, 'name');
      expect(result).toBe('John');
    });

    it('should return undefined for non-existent single level key', () => {
      const obj = { name: 'John' };
      const result = getNestedValue(obj, 'age');
      expect(result).toBeUndefined();
    });
  });

  describe('multi level path access', () => {
    it('should get value from two level path', () => {
      const obj = { user: { name: 'John' } };
      const result = getNestedValue(obj, 'user.name');
      expect(result).toBe('John');
    });

    it('should get value from deeply nested path', () => {
      const obj = { user: { profile: { address: { city: 'NYC' } } } };
      const result = getNestedValue(obj, 'user.profile.address.city');
      expect(result).toBe('NYC');
    });

    it('should get numeric value from nested path', () => {
      const obj = { stats: { scores: { math: 95 } } };
      const result = getNestedValue(obj, 'stats.scores.math');
      expect(result).toBe(95);
    });

    it('should get boolean value from nested path', () => {
      const obj = { settings: { enabled: true } };
      const result = getNestedValue(obj, 'settings.enabled');
      expect(result).toBe(true);
    });
  });

  describe('empty object handling', () => {
    it('should return undefined for empty object', () => {
      const obj = {};
      const result = getNestedValue(obj, 'name');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty object with nested path', () => {
      const obj = {};
      const result = getNestedValue(obj, 'user.name');
      expect(result).toBeUndefined();
    });
  });

  describe('empty path handling', () => {
    it('should return undefined for empty path', () => {
      const obj = { name: 'John' };
      const result = getNestedValue(obj, '');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null path', () => {
      const obj = { name: 'John' };
      const result = getNestedValue(obj, null as any);
      expect(result).toBeUndefined();
    });
  });

  describe('undefined value handling', () => {
    it('should return undefined when intermediate value is undefined', () => {
      const obj = { user: undefined };
      const result = getNestedValue(obj, 'user.name');
      expect(result).toBeUndefined();
    });

    it('should return undefined when accessing property of undefined', () => {
      const obj = {};
      const result = getNestedValue(obj, 'nonexistent.property');
      expect(result).toBeUndefined();
    });

    it('should return undefined value if it exists', () => {
      const obj = { value: undefined };
      const result = getNestedValue(obj, 'value');
      expect(result).toBeUndefined();
    });
  });

  describe('null value handling', () => {
    it('should return null when value is explicitly null', () => {
      const obj = { value: null };
      const result = getNestedValue(obj, 'value');
      expect(result).toBeNull();
    });

    it('should return undefined when intermediate value is null', () => {
      const obj = { user: null };
      const result = getNestedValue(obj, 'user.name');
      expect(result).toBeUndefined();
    });

    it('should return undefined when accessing property of null', () => {
      const obj = { user: null };
      const result = getNestedValue(obj, 'user.profile.name');
      expect(result).toBeUndefined();
    });
  });

  describe('array path handling', () => {
    it('should get value from array by index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const result = getNestedValue(obj, 'items.0');
      expect(result).toBe('a');
    });

    it('should get nested value inside array element', () => {
      const obj = { users: [{ name: 'John' }, { name: 'Jane' }] };
      const result = getNestedValue(obj, 'users.0.name');
      expect(result).toBe('John');
    });

    it('should return undefined for out of bounds array index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const result = getNestedValue(obj, 'items.5');
      expect(result).toBeUndefined();
    });

    it('should handle mixed array and object paths', () => {
      const obj = { data: { list: [{ id: 1 }, { id: 2 }] } };
      const result = getNestedValue(obj, 'data.list.1.id');
      expect(result).toBe(2);
    });
  });

  describe('special cases', () => {
    it('should handle null object input', () => {
      const obj = null as any;
      const result = getNestedValue(obj, 'name');
      expect(result).toBeUndefined();
    });

    it('should handle undefined object input', () => {
      const obj = undefined as any;
      const result = getNestedValue(obj, 'name');
      expect(result).toBeUndefined();
    });

    it('should handle path with consecutive dots', () => {
      const obj = { a: { '': { b: 'value' } } };
      const result = getNestedValue(obj, 'a..b');
      expect(result).toBe('value');
    });

    it('should handle property named constructor', () => {
      const obj = { constructor: 'MyClass' };
      const result = getNestedValue(obj, 'constructor');
      expect(result).toBe('MyClass');
    });

    it('should handle property named __proto__', () => {
      const obj = { __proto__: { test: 'value' } };
      const result = getNestedValue(obj, '__proto__.test');
      expect(result).toBe('value');
    });
  });
});

describe('additional coverage', () => {
  it('should handle circular reference in non-strict mode', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    const template = 'Data: {{ data }}';
    const variables = { data: obj };
    const result = parseTemplate(template, variables);
    expect(result).toBe('Data: {{ data }}');
  });

  it('should handle circular reference in strict mode', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    const template = 'Data: {{ data }}';
    const variables = { data: obj };
    expect(() => parseTemplate(template, variables, { strict: true })).toThrow();
  });

  it('should handle complex expression with special characters', () => {
    const template = 'Result: {{ value || "N/A" }}';
    const variables = { value: 'success' };
    const result = parseTemplate(template, variables);
    expect(result).toBe('Result: success');
  });
});
