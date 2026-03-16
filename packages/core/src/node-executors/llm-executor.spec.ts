import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMNodeExecutor } from './llm-executor';
import { ExecutionContext } from '../workflow-executor';

// Mock @ai-engine/providers
vi.mock('@ai-engine/providers', () => ({
  getProviderFactory: vi.fn(),
}));

import { getProviderFactory } from '@ai-engine/providers';

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

describe('LLMNodeExecutor', () => {
  let executor: LLMNodeExecutor;
  let context: ExecutionContext;
  let mockProvider: any;
  let mockProviderFactory: any;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new LLMNodeExecutor();
    context = createMockContext();
    
    mockProvider = {
      name: 'ollama',
      chatComplete: vi.fn(),
    };
    
    mockProviderFactory = {
      getProviderForModel: vi.fn(),
      getModelName: vi.fn(),
    };
    
    (getProviderFactory as any).mockReturnValue(mockProviderFactory);
  });

  describe('canExecute', () => {
    it('should return true for llm node type', () => {
      const result = executor.canExecute('llm');
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      expect(executor.canExecute('start')).toBe(false);
      expect(executor.canExecute('http')).toBe(false);
      expect(executor.canExecute('condition')).toBe(false);
      expect(executor.canExecute('end')).toBe(false);
      expect(executor.canExecute('tool')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should call provider with correct parameters', async () => {
      const config = {
        modelId: 'ollama:qwen3.5:9b',
        prompt: 'Hello, {{name}}!',
        temperature: 0.7,
        maxTokens: 100,
      };
      
      context.variables = { name: 'World' };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue({
        content: 'Hello, World!',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      });

      const result = await executor.execute(config, context);

      expect(mockProviderFactory.getProviderForModel).toHaveBeenCalledWith('ollama:qwen3.5:9b');
      expect(mockProviderFactory.getModelName).toHaveBeenCalledWith('ollama:qwen3.5:9b');
      expect(mockProvider.chatComplete).toHaveBeenCalledWith(
        {
          messages: [{ role: 'user', content: 'Hello, World!' }],
          model: 'qwen3.5:9b',
          temperature: 0.7,
          maxTokens: 100,
        },
        {
          provider: 'ollama',
          model: 'qwen3.5:9b',
        }
      );
      expect(result.success).toBe(true);
      expect(result.output.content).toBe('Hello, World!');
    });

    it('should handle template variables in prompt', async () => {
      const config = {
        prompt: 'Summarize: {{text}}',
      };
      
      context.variables = { text: 'This is a long text to summarize.' };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue({
        content: 'Summary of the text.',
      });

      await executor.execute(config, context);

      expect(mockProvider.chatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Summarize: This is a long text to summarize.' }],
        }),
        expect.any(Object)
      );
    });

    it('should use default modelId when not provided', async () => {
      const config = {
        prompt: 'Test prompt',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue({ content: 'Response' });

      await executor.execute(config, context);

      expect(mockProviderFactory.getProviderForModel).toHaveBeenCalledWith('ollama:qwen3.5:9b');
    });

    it('should pass temperature and maxTokens configuration', async () => {
      const config = {
        prompt: 'Test',
        temperature: 0.9,
        maxTokens: 500,
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue({ content: 'Response' });

      await executor.execute(config, context);

      expect(mockProvider.chatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 500,
        }),
        expect.any(Object)
      );
    });

    it('should handle streaming response', async () => {
      const config = {
        prompt: 'Stream this',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue({
        content: 'Streamed content',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      });

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.content).toBe('Streamed content');
      expect(result.output.usage).toBeDefined();
      expect(result.output.duration).toBeDefined();
    });

    it('should handle empty response from provider', async () => {
      const config = {
        prompt: 'Empty test',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockResolvedValue(null);

      const result = await executor.execute(config, context);

      expect(result.success).toBe(true);
      expect(result.output.content).toBe('');
    });

    it('should handle provider error', async () => {
      const config = {
        prompt: 'Error test',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockRejectedValue(new Error('API Error'));

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle unknown error type', async () => {
      const config = {
        prompt: 'Unknown error test',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockRejectedValue('String error');

      const result = await executor.execute(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should calculate execution duration', async () => {
      const config = {
        prompt: 'Duration test',
      };
      
      mockProviderFactory.getProviderForModel.mockReturnValue(mockProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen3.5:9b');
      mockProvider.chatComplete.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ content: 'Done' }), 10);
        });
      });

      const result = await executor.execute(config, context);

      expect(result.output.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('provider selection', () => {
    it('should select provider based on modelId', async () => {
      const config = {
        modelId: 'aliyun:qwen-turbo',
        prompt: 'Test',
      };
      
      const aliyunProvider = { name: 'aliyun', chatComplete: vi.fn().mockResolvedValue({ content: 'Response' }) };
      mockProviderFactory.getProviderForModel.mockReturnValue(aliyunProvider);
      mockProviderFactory.getModelName.mockReturnValue('qwen-turbo');

      await executor.execute(config, context);

      expect(mockProviderFactory.getProviderForModel).toHaveBeenCalledWith('aliyun:qwen-turbo');
    });
  });
});
