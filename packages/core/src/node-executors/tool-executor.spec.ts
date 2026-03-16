import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolNodeExecutor } from './tool-executor';
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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('ToolNodeExecutor', () => {
  let executor: ToolNodeExecutor;
  let context: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new ToolNodeExecutor();
    context = createMockContext();
  });

  describe('canExecute', () => {
    it('should return true for tool node type', () => {
      const result = executor.canExecute('tool');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('start')).toBe(false);
      expect(executor.canExecute('llm')).toBe(false);
      expect(executor.canExecute('http')).toBe(false);
      expect(executor.canExecute('condition')).toBe(false);
      expect(executor.canExecute('end')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should call tool with correct parameters', async () => {
      const config = {
        toolName: 'calculator',
        params: {
          operation: 'add',
          a: 5,
          b: 3,
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { result: 8 },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/tools/calculator/execute',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            params: {
              operation: 'add',
              a: 5,
              b: 3,
            },
          }),
        }
      );
      expect(result.success).toBe(true);
      expect(result.output.result).toBe(8);
    });

    it('should pass parameters to tool', async () => {
      const config = {
        toolName: 'search',
        params: {
          query: 'test query',
          limit: 10,
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { results: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.params).toEqual({
        query: 'test query',
        limit: 10,
      });
    });

    it('should parse template in string parameters', async () => {
      const config = {
        toolName: 'email',
        params: {
          to: '{{userEmail}}',
          subject: 'Hello {{userName}}',
        },
      };

      context.variables = {
        userEmail: 'test@example.com',
        userName: 'John',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { sent: true },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.params).toEqual({
        to: 'test@example.com',
        subject: 'Hello John',
      });
    });

    it('should handle non-string parameters without template parsing', async () => {
      const config = {
        toolName: 'math',
        params: {
          numbers: [1, 2, 3],
          config: { precision: 2 },
          count: 42,
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { sum: 6 },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.params).toEqual({
        numbers: [1, 2, 3],
        config: { precision: 2 },
        count: 42,
      });
    });

    it('should use custom API_BASE_URL when configured', async () => {
      const originalEnv = process.env.API_BASE_URL;
      process.env.API_BASE_URL = 'https://custom-api.example.com';

      const config = {
        toolName: 'test',
        params: {},
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, data: {} }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/api/tools/test/execute',
        expect.any(Object)
      );

      process.env.API_BASE_URL = originalEnv;
    });

    it('should include API key in headers when available', async () => {
      const config = {
        toolName: 'secure-tool',
        params: {},
      };

      context.apiKey = 'secret-api-key-123';

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, data: {} }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toMatch(/\/api\/tools\/secure-tool\/execute$/);
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
        'X-API-Key': 'secret-api-key-123',
      });
    });

    it('should handle tool not found (404)', async () => {
      const config = {
        toolName: 'non-existent-tool',
        params: {},
      };

      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({
          error: 'Tool not found',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool not found');
    });

    it('should handle tool execution error', async () => {
      const config = {
        toolName: 'failing-tool',
        params: {},
      };

      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({
          error: 'Internal tool error',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal tool error');
    });

    it('should handle missing tool name', async () => {
      const config = {
        toolName: undefined,
        params: {},
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool name is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty tool name', async () => {
      const config = {
        toolName: '',
        params: {},
      };

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool name is required');
    });

    it('should handle network errors', async () => {
      const config = {
        toolName: 'test-tool',
        params: {},
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should calculate execution duration', async () => {
      const config = {
        toolName: 'slow-tool',
        params: {},
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, data: {} }),
      };
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 10);
        });
      });

      const result = await executor.execute(config, context);

      expect(result.output.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle tool returning success: false', async () => {
      const config = {
        toolName: 'validation-tool',
        params: {},
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Validation failed',
          data: {},
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should handle response without error field on failure', async () => {
      const config = {
        toolName: 'test-tool',
        params: {},
      };

      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool execution failed with status 500');
    });
  });

  describe('error handling', () => {
    it('should catch and return error if execution fails', async () => {
      const config = {
        toolName: 'test',
        params: {},
      };

      mockFetch.mockRejectedValue(new Error('Unexpected error'));

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle unknown error type', async () => {
      const config = {
        toolName: 'test',
        params: {},
      };

      mockFetch.mockRejectedValue('String error');

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
