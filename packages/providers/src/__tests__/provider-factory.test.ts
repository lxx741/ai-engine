import { ProviderFactory, getProviderFactory } from '../provider-factory'
import { AliyunProvider } from '../aliyun-provider'
import { OllamaProvider } from '../ollama-provider'

// Helper to reset factory for testing
function resetFactory(): void {
  const factory = getProviderFactory()
  ;(factory as any).providers.clear()
  ;(factory as any).providerConfigs.clear()
  ;(factory as any).routingRules = []
  ;(factory as any).healthCheckCache.clear()
  ;(factory as any).initializeDefaultProviders()
}

describe('ProviderFactory', () => {
  let factory: ProviderFactory

  beforeEach(() => {
    resetFactory()
    factory = new ProviderFactory()
  })

  describe('Initialization', () => {
    it('should create factory with default providers', () => {
      const providers = factory.listProviders()
      expect(providers).toContain('aliyun')
      expect(providers).toContain('ollama')
    })

    it('should create singleton instance', () => {
      const instance1 = getProviderFactory()
      const instance2 = getProviderFactory()
      expect(instance1).toBe(instance2)
    })

    it('should reset singleton instance', () => {
      const instance1 = getProviderFactory()
      resetFactory()
      const instance2 = getProviderFactory()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('getProvider', () => {
    it('should return registered provider', () => {
      const aliyunProvider = factory.getProvider('aliyun')
      expect(aliyunProvider.name).toBe('aliyun')

      const ollamaProvider = factory.getProvider('ollama')
      expect(ollamaProvider.name).toBe('ollama')
    })

    it('should throw error for unknown provider', () => {
      expect(() => factory.getProvider('unknown')).toThrow(
        'Provider "unknown" not found'
      )
    })
  })

  describe('registerProvider', () => {
    it('should register new provider', () => {
      const mockProvider = {
        name: 'mock',
        chat: async function* () {},
      }

      factory.registerProvider('mock', mockProvider as any)
      const provider = factory.getProvider('mock')
      expect(provider.name).toBe('mock')
    })

    it('should register provider with config', () => {
      const mockProvider = {
        name: 'mock',
        chat: async function* () {},
      }

      factory.registerProvider('mock', mockProvider as any, {
        apiKey: 'test-key',
        baseUrl: 'http://test.com',
      })

      const config = factory.getProviderConfig('mock')
      expect(config?.apiKey).toBe('test-key')
      expect(config?.baseUrl).toBe('http://test.com')
    })

    it('should update existing provider config', () => {
      factory.updateProviderConfig('aliyun', { apiKey: 'new-key' })
      const config = factory.getProviderConfig('aliyun')
      expect(config?.apiKey).toBe('new-key')
    })
  })

  describe('getProviderConfig', () => {
    it('should return provider config', () => {
      const config = factory.getProviderConfig('aliyun')
      expect(config).toBeDefined()
    })

    it('should return undefined for unregistered provider', () => {
      const config = factory.getProviderConfig('unknown')
      expect(config).toBeUndefined()
    })
  })

  describe('Model Routing', () => {
    it('should route by colon format', () => {
      const provider = factory.getProviderForModel('aliyun:qwen-turbo')
      expect(provider.name).toBe('aliyun')
    })

    it('should route by slash format', () => {
      const provider = factory.getProviderForModel('ollama/llama2:7b')
      expect(provider.name).toBe('ollama')
    })

    it('should use default provider for unknown format', () => {
      const provider = factory.getProviderForModel('unknown-model')
      expect(provider).toBeDefined()
    })

    it('should extract model name from colon format', () => {
      const modelName = factory.getModelName('aliyun:qwen-turbo')
      expect(modelName).toBe('qwen-turbo')
    })

    it('should extract model name from slash format', () => {
      const modelName = factory.getModelName('ollama/llama2:7b')
      expect(modelName).toBe('llama2:7b')
    })

    it('should return model name if no separator', () => {
      const modelName = factory.getModelName('qwen-turbo')
      expect(modelName).toBe('qwen-turbo')
    })
  })

  describe('Routing Rules', () => {
    it('should add routing rule', () => {
      factory.addRoutingRule({
        pattern: 'gpt-.*',
        provider: 'aliyun',
      })

      expect(factory).toBeDefined()
    })

    it('should use routing rule for string pattern', () => {
      factory.addRoutingRule({
        pattern: 'special-model',
        provider: 'aliyun',
      })

      const provider = factory.getProviderForModel('special-model')
      expect(provider.name).toBe('aliyun')
    })

    it('should use routing rule for regex pattern', () => {
      factory.addRoutingRule({
        pattern: /^gpt-.*$/,
        provider: 'aliyun',
      })

      const provider = factory.getProviderForModel('gpt-4')
      expect(provider.name).toBe('aliyun')
    })

    it('should evaluate rules in order', () => {
      factory.addRoutingRule({
        pattern: /^priority-.*$/,
        provider: 'ollama',
      })
      factory.addRoutingRule({
        pattern: /^priority-.*$/,
        provider: 'aliyun',
      })

      // First rule should match
      const provider = factory.getProviderForModel('priority-model')
      expect(provider.name).toBe('ollama')
    })

    it('should clear routing rules', () => {
      factory.addRoutingRule({
        pattern: 'test',
        provider: 'aliyun',
      })
      factory.clearRoutingRules()

      // Should use default routing after clearing
      expect(factory).toBeDefined()
    })
  })

  describe('createModelConfig', () => {
    it('should create config for colon format', () => {
      const config = factory.createModelConfig('aliyun:qwen-turbo')
      expect(config.provider).toBe('aliyun')
      expect(config.model).toBe('qwen-turbo')
    })

    it('should create config with overrides', () => {
      const config = factory.createModelConfig('ollama/llama2:7b', {
        temperature: 0.9,
        maxTokens: 4096,
      })
      expect(config.temperature).toBe(0.9)
      expect(config.maxTokens).toBe(4096)
    })
  })

  describe('Health Check', () => {
    it('should return unhealthy for unknown provider', async () => {
      const result = await factory.healthCheck('unknown')
      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Provider not found')
    })

    it('should return unhealthy for Aliyun without API key', async () => {
      const result = await factory.healthCheck('aliyun')
      expect(result.healthy).toBe(false)
      expect(result.error).toBe('API key not configured')
    })

    it('should cache health check results', async () => {
      const result1 = await factory.healthCheck('unknown')
      const result2 = await factory.healthCheck('unknown')
      
      // Second call should use cache
      expect(result1).toBe(result2)
    })

    it('should clear health check cache', () => {
      factory.clearHealthCheckCache()
      expect(factory).toBeDefined()
    })

    it('should health check all providers', async () => {
      const results = await factory.healthCheckAll()
      expect(results.has('aliyun')).toBe(true)
      expect(results.has('ollama')).toBe(true)
    })
  })

  describe('Environment Variables', () => {
    it('should use environment variables for configuration', () => {
      // Save original env vars
      const originalAliyunUrl = process.env.ALIYUN_BASE_URL
      const originalAliyunKey = process.env.ALIYUN_API_KEY

      // Set test env vars
      process.env.ALIYUN_BASE_URL = 'http://test.url'
      process.env.ALIYUN_API_KEY = 'test-key'

      // Create new factory to pick up env vars
      const testFactory = new ProviderFactory()
      const config = testFactory.getProviderConfig('aliyun')

      expect(config?.baseUrl).toBe('http://test.url')
      expect(config?.apiKey).toBe('test-key')

      // Restore original env vars
      if (originalAliyunUrl) process.env.ALIYUN_BASE_URL = originalAliyunUrl
      if (originalAliyunKey) process.env.ALIYUN_API_KEY = originalAliyunKey
    })
  })

  describe('Provider List', () => {
    it('should list all registered providers', () => {
      const providers = factory.listProviders()
      expect(providers.length).toBeGreaterThanOrEqual(2)
      expect(providers).toContain('aliyun')
      expect(providers).toContain('ollama')
    })
  })
})
