// Load environment variables BEFORE any other imports
// This ensures API keys are available when Provider Factory initializes
if (typeof process !== 'undefined') {
  try {
    const path = require('path')
    const dotenv = require('dotenv')
    // Try multiple possible locations for .env.local
    const possiblePaths = [
      path.join(process.cwd(), '.env.local'),
      path.join(__dirname, '../../.env.local'),
      path.join(__dirname, '../../../.env.local'),
    ]
    for (const envPath of possiblePaths) {
      try {
        const result = dotenv.config({ path: envPath })
        if (result.parsed && result.parsed.ALIYUN_API_KEY) {
          console.log(`[ProviderFactory] Loaded .env.local from ${envPath}`)
          break
        }
      } catch (e) {
        // Try next path
      }
    }
  } catch (e) {
    // dotenv not available, skip
  }
}

import { ILLMProvider, IProviderFactory } from '@ai-engine/core'
import { ModelConfig, ProviderType } from '@ai-engine/shared'
import { AliyunProvider } from './aliyun-provider'
import { OllamaProvider } from './ollama-provider'

/**
 * Provider configuration
 */
interface ProviderConfig {
  baseUrl?: string
  apiKey?: string
  timeout?: number
  [key: string]: any
}

/**
 * Health check result
 */
interface HealthCheckResult {
  provider: string
  healthy: boolean
  error?: string
  responseTime?: number
}

/**
 * Model routing rule
 */
interface ModelRoutingRule {
  pattern: string | RegExp
  provider: string
  model?: string
}

/**
 * Provider Factory - Creates and manages LLM provider instances
 */
export class ProviderFactory implements IProviderFactory {
  private providers: Map<string, ILLMProvider> = new Map()
  private providerConfigs: Map<string, ProviderConfig> = new Map()
  private routingRules: ModelRoutingRule[] = []
  private healthCheckCache: Map<string, HealthCheckResult> = new Map()
  private healthCheckTTL: number = 60000 // 1 minute cache

  constructor() {
    // Register default providers with environment-based configuration
    this.initializeDefaultProviders()
  }

  /**
   * Initialize default providers from environment variables
   */
  private initializeDefaultProviders(): void {
    // Aliyun provider
    const aliyunBaseUrl = process.env.ALIYUN_BASE_URL
    const aliyunApiKey = process.env.ALIYUN_API_KEY
    const aliyunTimeout = process.env.ALIYUN_TIMEOUT
      ? parseInt(process.env.ALIYUN_TIMEOUT, 10)
      : undefined

    const aliyunConfig: ProviderConfig = {}
    if (aliyunBaseUrl) aliyunConfig.baseUrl = aliyunBaseUrl
    if (aliyunApiKey) aliyunConfig.apiKey = aliyunApiKey
    if (aliyunTimeout) aliyunConfig.timeout = aliyunTimeout

    this.registerProvider('aliyun', new AliyunProvider(
      aliyunConfig.baseUrl,
      aliyunConfig.timeout || 30000
    ), aliyunConfig)

    // Ollama provider
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
    const ollamaTimeout = process.env.OLLAMA_TIMEOUT
      ? parseInt(process.env.OLLAMA_TIMEOUT, 10)
      : undefined
    const ollamaCacheTTL = process.env.OLLAMA_CACHE_TTL
      ? parseInt(process.env.OLLAMA_CACHE_TTL, 10)
      : undefined

    const ollamaConfig: ProviderConfig = {}
    if (ollamaBaseUrl) ollamaConfig.baseUrl = ollamaBaseUrl
    if (ollamaTimeout) ollamaConfig.timeout = ollamaTimeout
    if (ollamaCacheTTL) ollamaConfig.cacheTTL = ollamaCacheTTL

    this.registerProvider('ollama', new OllamaProvider(
      ollamaConfig.baseUrl,
      ollamaConfig.timeout || 60000,
      ollamaConfig.cacheTTL || 300000
    ), ollamaConfig)
  }

  /**
   * Get or create a provider instance
   */
  getProvider(type: string): ILLMProvider {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(
        `Provider "${type}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      )
    }
    return provider
  }

  /**
   * Register a provider with optional configuration
   */
  registerProvider(
    type: string,
    provider: ILLMProvider,
    config?: ProviderConfig
  ): void {
    this.providers.set(type, provider)
    if (config) {
      this.providerConfigs.set(type, config)
    }
  }

  /**
   * List registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(type: string): ProviderConfig | undefined {
    return this.providerConfigs.get(type)
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(type: string, config: Partial<ProviderConfig>): void {
    const existing = this.providerConfigs.get(type) || {}
    this.providerConfigs.set(type, { ...existing, ...config })
  }

  /**
   * Add a model routing rule
   * Rules are evaluated in order, first match wins
   */
  addRoutingRule(rule: ModelRoutingRule): void {
    this.routingRules.push(rule)
  }

  /**
   * Clear all routing rules
   */
  clearRoutingRules(): void {
    this.routingRules = []
  }

  /**
   * Get provider for a specific model ID
   * Uses routing rules if configured, otherwise extracts provider from model ID
   */
  getProviderForModel(modelId: string): ILLMProvider {
    // Check routing rules first
    for (const rule of this.routingRules) {
      const matches =
        typeof rule.pattern === 'string'
          ? modelId === rule.pattern
          : rule.pattern.test(modelId)

      if (matches) {
        return this.getProvider(rule.provider)
      }
    }

    // Default routing: extract provider from model ID
    // Format: "provider:model" or "provider/model"
    const colonMatch = modelId.match(/^([^:]+):(.+)$/)
    const slashMatch = modelId.match(/^([^/]+)\/(.+)$/)

    if (colonMatch) {
      const [, provider] = colonMatch
      if (this.providers.has(provider)) {
        return this.getProvider(provider)
      }
    }

    if (slashMatch) {
      const [, provider] = slashMatch
      if (this.providers.has(provider)) {
        return this.getProvider(provider)
      }
    }

    // Default to first available provider
    const firstProvider = this.providers.keys().next().value
    if (firstProvider) {
      return this.getProvider(firstProvider)
    }

    throw new Error(`No provider available for model: ${modelId}`)
  }

  /**
   * Get model name from model ID
   */
  getModelName(modelId: string): string {
    const colonMatch = modelId.match(/^([^:]+):(.+)$/)
    const slashMatch = modelId.match(/^([^/]+)\/(.+)$/)

    if (colonMatch) {
      return colonMatch[2]
    }

    if (slashMatch) {
      return slashMatch[2]
    }

    return modelId
  }

  /**
   * Perform health check on a provider
   */
  async healthCheck(providerType: string): Promise<HealthCheckResult> {
    // Check cache first
    const cached = this.healthCheckCache.get(providerType)
    if (cached && Date.now() - (cached.responseTime || 0) < this.healthCheckTTL) {
      return cached
    }

    const startTime = Date.now()
    const provider = this.providers.get(providerType)

    if (!provider) {
      const result: HealthCheckResult = {
        provider: providerType,
        healthy: false,
        error: 'Provider not found',
        responseTime: Date.now() - startTime,
      }
      this.healthCheckCache.set(providerType, result)
      return result
    }

    try {
      // Different health check strategies based on provider type
      if (providerType === 'ollama' && 'listModels' in provider) {
        await (provider as any).listModels()
      } else if (providerType === 'aliyun') {
        // For Aliyun, we can't do a simple health check without credentials
        // Just check if the provider is initialized
        const config = this.providerConfigs.get(providerType)
        if (!config?.apiKey) {
          const result: HealthCheckResult = {
            provider: providerType,
            healthy: false,
            error: 'API key not configured',
            responseTime: Date.now() - startTime,
          }
          this.healthCheckCache.set(providerType, result)
          return result
        }
      }

      const result: HealthCheckResult = {
        provider: providerType,
        healthy: true,
        responseTime: Date.now() - startTime,
      }
      this.healthCheckCache.set(providerType, result)
      return result
    } catch (error) {
      const result: HealthCheckResult = {
        provider: providerType,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      }
      this.healthCheckCache.set(providerType, result)
      return result
    }
  }

  /**
   * Perform health check on all providers
   */
  async healthCheckAll(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>()

    for (const providerType of this.providers.keys()) {
      const result = await this.healthCheck(providerType)
      results.set(providerType, result)
    }

    return results
  }

  /**
   * Clear health check cache
   */
  clearHealthCheckCache(): void {
    this.healthCheckCache.clear()
  }

  /**
   * Create a model config with proper provider routing
   */
  createModelConfig(modelId: string, overrides?: Partial<ModelConfig>): ModelConfig {
    const provider = this.getProviderForModel(modelId)
    const modelName = this.getModelName(modelId)
    const providerConfig = this.providerConfigs.get(provider.name) || {}

    return {
      provider: provider.name as ProviderType,
      model: modelName,
      baseUrl: providerConfig.baseUrl,
      apiKey: providerConfig.apiKey,
      ...overrides,
    }
  }
}

// Singleton instance
let factoryInstance: ProviderFactory | null = null

export function getProviderFactory(): ProviderFactory {
  if (!factoryInstance) {
    factoryInstance = new ProviderFactory()
  }
  return factoryInstance
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetProviderFactory(): void {
  factoryInstance = null
}
