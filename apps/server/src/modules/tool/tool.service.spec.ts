import { ToolService } from './tool.service';
import { ToolRegistry } from './tool.registry';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ToolRegistry
const mockToolRegistry = {
  register: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  execute: vi.fn(),
};

describe('ToolService', () => {
  let toolService: ToolService;

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();

    // 直接实例化服务，传入 mock 的 ToolRegistry
    toolService = new ToolService(mockToolRegistry as unknown as ToolRegistry);
  });

  // ==================== 基础测试 ====================
  it('should be defined', () => {
    expect(toolService).toBeDefined();
  });

  // ==================== listTools 方法测试 ====================
  describe('listTools', () => {
    it('should return all registered tools', () => {
      const mockTools = [
        { name: 'http', description: 'HTTP request tool', parameters: { type: 'object' } },
        { name: 'code', description: 'Code execution tool', parameters: { type: 'object' } },
        { name: 'time', description: 'Time utility tool', parameters: { type: 'object' } },
      ];

      mockToolRegistry.list.mockReturnValue(mockTools);

      const result = toolService.listTools();

      expect(mockToolRegistry.list).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockTools);
    });

    it('should return complete tool info (name, description, parameters)', () => {
      const mockTools = [
        {
          name: 'http',
          description: 'Make HTTP requests',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              method: { type: 'string' },
            },
          },
        },
      ];

      mockToolRegistry.list.mockReturnValue(mockTools);

      const result = toolService.listTools();

      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('parameters');
      expect(result[0].name).toBe('http');
      expect(result[0].description).toBe('Make HTTP requests');
      expect(result[0].parameters).toEqual({
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string' },
        },
      });
    });
  });

  // ==================== getTool 方法测试 ====================
  describe('getTool', () => {
    it('should return existing tool', () => {
      const mockTool = {
        name: 'http',
        description: 'HTTP request tool',
        parameters: { type: 'object' },
      };

      mockToolRegistry.get.mockReturnValue(mockTool);

      const result = toolService.getTool('http');

      expect(mockToolRegistry.get).toHaveBeenCalledWith('http');
      expect(result).toBeDefined();
      expect(result?.name).toBe('http');
      expect(result?.description).toBe('HTTP request tool');
    });

    it('should return null for non-existent tool', () => {
      mockToolRegistry.get.mockReturnValue(undefined);

      const result = toolService.getTool('non-existent-tool');

      expect(mockToolRegistry.get).toHaveBeenCalledWith('non-existent-tool');
      expect(result).toBeNull();
    });
  });

  // ==================== executeTool 方法测试 ====================
  describe('executeTool', () => {
    it('should execute tool successfully', async () => {
      const toolName = 'http';
      const params = { url: 'https://api.example.com', method: 'GET' };
      const mockResult = {
        success: true,
        data: { status: 200, body: 'OK' },
      };

      mockToolRegistry.execute.mockResolvedValue(mockResult);

      const result = await toolService.executeTool(toolName, params);

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(toolName, params);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: 200, body: 'OK' });
      expect(result.error).toBeUndefined();
    });

    it('should handle tool execution failure (tool throws error)', async () => {
      const toolName = 'code';
      const params = { code: 'invalid code' };
      const mockErrorResult = {
        success: false,
        error: 'SyntaxError: Unexpected token',
      };

      mockToolRegistry.execute.mockResolvedValue(mockErrorResult);

      const result = await toolService.executeTool(toolName, params);

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(toolName, params);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SyntaxError: Unexpected token');
    });

    it('should handle parameter validation failure', async () => {
      const toolName = 'http';
      const params = { invalidParam: 'missing required url' };
      const mockValidationResult = {
        success: false,
        error: 'Invalid parameters: data must have required property "url"',
      };

      mockToolRegistry.execute.mockResolvedValue(mockValidationResult);

      const result = await toolService.executeTool(toolName, params);

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(toolName, params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });

    it('should return error result when tool is not registered', async () => {
      const toolName = 'unknown-tool';
      const params = { some: 'param' };
      const mockNotFoundResult = {
        success: false,
        error: 'Tool "unknown-tool" not found',
      };

      mockToolRegistry.execute.mockResolvedValue(mockNotFoundResult);

      const result = await toolService.executeTool(toolName, params);

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(toolName, params);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool "unknown-tool" not found');
    });
  });

  // ==================== 构造函数测试 ====================
  describe('constructor', () => {
    it('should initialize built-in tools on construction', () => {
      // 验证 register 被调用了 3 次 (HttpTool, CodeTool, TimeTool)
      expect(mockToolRegistry.register).toHaveBeenCalledTimes(3);

      // 验证注册了正确的工具类型（通过检查调用参数）
      const registeredTools = mockToolRegistry.register.mock.calls.map(call => call[0]);
      expect(registeredTools).toHaveLength(3);
      expect(registeredTools.map(t => t.name)).toEqual(
        expect.arrayContaining(['http', 'code', 'time']),
      );
    });
  });
});
