import { ProviderFactory, getProviderFactory } from '../provider-factory'
import { AliyunProvider } from '../aliyun-provider'
import { OllamaProvider } from '../ollama-provider'
import { ChatCompletionRequest, ModelConfig } from '@ai-engine/shared'

// Helper to reset factory for testing
function resetFactory(): void {
  const factory = getProviderFactory()
  ;(factory as any).providers.clear()
  ;(factory as any).providerConfigs.clear()
  ;(factory as any).routingRules = []
  ;(factory as any).healthCheckCache.clear()
  ;(factory as any).initializeDefaultProviders()
}

/**
 * Integration Tests for LLM Providers
 * 
 * These tests require:
 * - Valid ALIYUN_API_KEY environment variable for Aliyun tests
 * - Running Ollama service at OLLAMA_BASE_URL for Ollama tests
 * 
 * Run with: pnpm test -- integration.test.ts
 */

describe('Integration Tests', () => {
  let factory: ProviderFactory

  const testRequest: ChatCompletionRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello! Please respond with just "Hi".' },
    ],
    maxTokens: 50,
  }

  beforeEach(() => {
    resetFactory()
    factory = new ProviderFactory()
  })

  describe('Aliyun Provider Integration', () => {
    const aliyunApiKey = process.env.ALIYUN_API_KEY

    it('should initialize with environment variables', () => {
      const provider = factory.getProvider('aliyun')
      expect(provider.name).toBe('aliyun')
    })

    it.skip('should complete chat request', async () => {
      if (!aliyunApiKey) {
        console.log('Skipping: ALIYUN_API_KEY not set')
        return
      }

      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: aliyunApiKey,
      }

      const result = await provider.chatComplete(testRequest, config)
      
      expect(result.content).toBeDefined()
      expect(result.content.length).toBeGreaterThan(0)
      expect(result.usage).toBeDefined()
      expect(result.usage?.totalTokens).toBeGreaterThan(0)
    }, 60000)

    it.skip('should stream chat response', async () => {
      if (!aliyunApiKey) {
        console.log('Skipping: ALIYUN_API_KEY not set')
        return
      }

      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: aliyunApiKey,
      }

      const chunks: string[] = []
      const stream = provider.chat(testRequest, config)

      for await (const chunk of stream) {
        chunks.push(chunk.content)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toBeDefined()
    }, 60000)

    it.skip('should handle invalid API key', async () => {
      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: 'invalid-key',
      }

      await expect(provider.chatComplete(testRequest, config))
        .rejects
        .toThrow()
    }, 60000)

    it.skip('should handle timeout', async () => {
      if (!aliyunApiKey) {
        console.log('Skipping: ALIYUN_API_KEY not set')
        return
      }

      const provider = new AliyunProvider(
        process.env.ALIYUN_BASE_URL,
        100, // 100ms timeout
        { maxRetries: 0, baseDelay: 100, maxDelay: 500 }
      )

      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: aliyunApiKey!,
      }

      // Create a request that might timeout
      const longRequest: ChatCompletionRequest = {
        messages: [
          { role: 'user', content: 'Write a long story.' },
        ],
        maxTokens: 2000,
      }

      await expect(provider.chatComplete(longRequest, config))
        .rejects
        .toThrow()
    }, 60000)
  })

  describe('Ollama Provider Integration', () => {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b'

    it('should initialize with environment variables', () => {
      const provider = factory.getProvider('ollama')
      expect(provider.name).toBe('ollama')
    })

    it.skip('should list available models', async () => {
      const provider = factory.getProvider('ollama') as OllamaProvider
      
      try {
        const models = await provider.listModels()
        expect(Array.isArray(models)).toBe(true)
        console.log('Available models:', models)
      } catch (error) {
        console.log('Ollama service not available:', error)
      }
    }, 10000)

    it.skip('should complete chat request', async () => {
      const provider = factory.getProvider('ollama') as OllamaProvider
      const config: ModelConfig = {
        provider: 'ollama',
        model: ollamaModel,
      }

      try {
        const result = await provider.chatComplete(testRequest, config)
        
        expect(result.content).toBeDefined()
        expect(result.content.length).toBeGreaterThan(0)
        expect(result.usage).toBeDefined()
        expect(result.usage?.totalTokens).toBeGreaterThan(0)
      } catch (error) {
        console.log('Ollama service not available:', error)
        throw error
      }
    }, 120000)

    it.skip('should stream chat response', async () => {
      const provider = factory.getProvider('ollama') as OllamaProvider
      const config: ModelConfig = {
        provider: 'ollama',
        model: ollamaModel,
      }

      try {
        const chunks: string[] = []
        const stream = provider.chat(testRequest, config)

        for await (const chunk of stream) {
          chunks.push(chunk.content)
        }

        expect(chunks.length).toBeGreaterThan(0)
        expect(chunks.join('')).toBeDefined()
      } catch (error) {
        console.log('Ollama service not available:', error)
        throw error
      }
    }, 120000)

    it.skip('should handle model not found', async () => {
      const provider = factory.getProvider('ollama') as OllamaProvider
      const config: ModelConfig = {
        provider: 'ollama',
        model: 'nonexistent-model:latest',
      }

      await expect(provider.chatComplete(testRequest, config))
        .rejects
        .toThrow()
    }, 60000)

    it.skip('should cache model list', async () => {
      const provider = factory.getProvider('ollama') as OllamaProvider
      
      try {
        const models1 = await provider.listModels()
        const models2 = await provider.listModels()
        
        // Both calls should return the same cached result
        expect(models1).toEqual(models2)
      } catch (error) {
        console.log('Ollama service not available:', error)
      }
    }, 10000)
  })

  describe('Provider Factory Routing Integration', () => {
    it('should route based on model ID format', () => {
      // Colon format
      const aliyunProvider = factory.getProviderForModel('aliyun:qwen-turbo')
      expect(aliyunProvider.name).toBe('aliyun')

      // Slash format
      const ollamaProvider = factory.getProviderForModel('ollama/llama2:7b')
      expect(ollamaProvider.name).toBe('ollama')
    })

    it('should create model config with routing', () => {
      const config = factory.createModelConfig('aliyun:qwen-max', {
        temperature: 0.8,
      })

      expect(config.provider).toBe('aliyun')
      expect(config.model).toBe('qwen-max')
      expect(config.temperature).toBe(0.8)
    })

    it('should use custom routing rules', () => {
      factory.addRoutingRule({
        pattern: /^gpt-.*$/,
        provider: 'aliyun',
      })

      const provider = factory.getProviderForModel('gpt-4')
      expect(provider.name).toBe('aliyun')
    })
  })

  describe('Health Check Integration', () => {
    it('should check Aliyun provider health', async () => {
      const result = await factory.healthCheck('aliyun')
      
      expect(result.provider).toBe('aliyun')
      expect(result.healthy).toBe(false) // Will be false without API key
      expect(result.error).toBeDefined()
    })

    it('should check Ollama provider health', async () => {
      const result = await factory.healthCheck('ollama')
      
      expect(result.provider).toBe('ollama')
      // Health depends on whether Ollama is running
      console.log('Ollama health:', result)
    })

    it('should check all providers', async () => {
      const results = await factory.healthCheckAll()
      
      expect(results.size).toBeGreaterThanOrEqual(2)
      
      for (const [provider, result] of results) {
        expect(result.provider).toBe(provider)
        expect('healthy' in result).toBe(true)
      }
    })
  })

  describe('Error Handling Integration', () => {
    it.skip('should handle network errors gracefully', async () => {
      const provider = new AliyunProvider(
        'http://invalid-url-that-does-not-exist.com',
        5000
      )

      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: 'test-key',
      }

      await expect(provider.chatComplete(testRequest, config))
        .rejects
        .toThrow()
    }, 10000)

    it('should provide detailed error messages', async () => {
      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
      }

      try {
        await provider.chatComplete(testRequest, config)
      } catch (error: any) {
        expect(error.message).toBeDefined()
        expect(error.code).toBeDefined()
      }
    })
  })

  describe('Performance Integration', () => {
    it.skip('should complete request within timeout', async () => {
      const aliyunApiKey = process.env.ALIYUN_API_KEY
      if (!aliyunApiKey) {
        console.log('Skipping: ALIYUN_API_KEY not set')
        return
      }

      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: aliyunApiKey,
      }

      const startTime = Date.now()
      const result = await provider.chatComplete(testRequest, config)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(30000) // 30 second timeout
      expect(result.content).toBeDefined()
      
      console.log(`Request completed in ${duration}ms`)
    }, 60000)

    it.skip('should stream with reasonable latency', async () => {
      const aliyunApiKey = process.env.ALIYUN_API_KEY
      if (!aliyunApiKey) {
        console.log('Skipping: ALIYUN_API_KEY not set')
        return
      }

      const provider = factory.getProvider('aliyun') as AliyunProvider
      const config: ModelConfig = {
        provider: 'aliyun',
        model: 'qwen-turbo',
        apiKey: aliyunApiKey,
      }

      const startTime = Date.now()
      const chunks: string[] = []
      const stream = provider.chat(testRequest, config)

      for await (const chunk of stream) {
        chunks.push(chunk.content)
      }

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(30000)
      expect(chunks.length).toBeGreaterThan(0)
      
      console.log(`Stream completed in ${duration}ms with ${chunks.length} chunks`)
    }, 60000)
  })
})
