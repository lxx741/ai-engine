import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPNodeExecutor } from './http-executor';
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

describe('HTTPNodeExecutor', () => {
  let executor: HTTPNodeExecutor;
  let context: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new HTTPNodeExecutor();
    context = createMockContext();
  });

  describe('canExecute', () => {
    it('should return true for http node type', () => {
      const result = executor.canExecute('http');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('start')).toBe(false);
      expect(executor.canExecute('llm')).toBe(false);
      expect(executor.canExecute('condition')).toBe(false);
      expect(executor.canExecute('end')).toBe(false);
      expect(executor.canExecute('tool')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should make GET request', async () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        headers: {
          entries: vi.fn().mockReturnValue([['content-type', 'application/json']]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: {},
        body: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.output.status).toBe(200);
      expect(result.output.data).toEqual({ data: 'test' });
    });

    it('should make POST request with body', async () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'POST',
        body: '{"name": "John"}',
      };

      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 1, name: 'John' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {},
        body: '{"name": "John"}',
      });
      expect(result.success).toBe(true);
      expect(result.output.status).toBe(201);
    });

    it('should handle custom headers', async () => {
      const config = {
        url: 'https://api.example.com/protected',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/protected', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
        body: undefined,
      });
    });

    it('should parse template in request body', async () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'POST',
        body: '{"name": "{{userName}}", "email": "{{userEmail}}"}',
      };

      context.variables = {
        userName: 'Alice',
        userEmail: 'alice@example.com',
      };

      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 1 }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {},
        body: '{"name": "Alice", "email": "alice@example.com"}',
      });
    });

    it('should parse template in URL', async () => {
      const config = {
        url: 'https://api.example.com/users/{{userId}}',
        method: 'GET',
      };

      context.variables = {
        userId: '12345',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ id: '12345' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/12345', expect.any(Object));
    });

    it('should parse template in headers', async () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{apiToken}}',
        },
      };

      context.variables = {
        apiToken: 'secret-token-123',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer secret-token-123',
        },
        body: undefined,
      });
    });

    it('should handle error response (non-2xx status)', async () => {
      const config = {
        url: 'https://api.example.com/not-found',
        method: 'GET',
      };

      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: 'Not found' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.output.status).toBe(404);
      expect(result.output.data).toEqual({ error: 'Not found' });
    });

    it('should handle network errors', async () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      const config = {
        url: 'https://api.example.com/slow',
        method: 'GET',
      };

      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 1000);
        });
      });

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });

    it('should calculate execution duration', async () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 10);
        });
      });

      const result = await executor.execute(config, context);

      expect(result.output.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty response body', async () => {
      const config = {
        url: 'https://api.example.com/empty',
        method: 'GET',
      };

      const mockResponse = {
        ok: true,
        status: 204,
        json: vi.fn().mockResolvedValue({}),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.status).toBe(204);
    });

    it('should use default GET method when not specified', async () => {
      const config = {
        url: 'https://api.example.com/data',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      await executor.execute(config, context);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: {},
        body: undefined,
      });
    });
  });
});
