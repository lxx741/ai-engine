import { ILLMProvider, IProviderFactory } from '@ai-engine/core'
import { AliyunProvider } from './aliyun-provider'
import { OllamaProvider } from './ollama-provider'

/**
 * Provider Factory - Creates and manages LLM provider instances
 */
export class ProviderFactory implements IProviderFactory {
  private providers: Map<string, ILLMProvider> = new Map()

  constructor() {
    // Register default providers
    this.registerProvider('aliyun', new AliyunProvider())
    this.registerProvider('ollama', new OllamaProvider())
  }

  getProvider(type: string): ILLMProvider {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Provider "${type}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`)
    }
    return provider
  }

  registerProvider(type: string, provider: ILLMProvider): void {
    this.providers.set(type, provider)
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys())
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
