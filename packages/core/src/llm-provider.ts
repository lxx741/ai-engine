import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared'

/**
 * LLM Provider Interface
 */
export interface ILLMProvider {
  /**
   * Provider name
   */
  readonly name: string

  /**
   * Chat completion with streaming support
   */
  chat(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): AsyncIterable<ChatCompletionChunk>

  /**
   * Chat completion without streaming
   */
  chatComplete?(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): Promise<{
    content: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }>

  /**
   * Generate embeddings
   */
  embedding?(texts: string[], config: ModelConfig): Promise<number[][]>

  /**
   * List available models
   */
  listModels?(config: ModelConfig): Promise<string[]>
}

/**
 * Provider Factory
 */
export interface IProviderFactory {
  /**
   * Get or create a provider instance
   */
  getProvider(type: string): ILLMProvider

  /**
   * Register a provider
   */
  registerProvider(type: string, provider: ILLMProvider): void
}
