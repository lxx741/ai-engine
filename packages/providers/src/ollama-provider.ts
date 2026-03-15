import { ILLMProvider } from '@ai-engine/core'
import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig, ChatMessage } from '@ai-engine/shared'

/**
 * Ollama Provider Error Types
 */
export class OllamaProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'OllamaProviderError'
  }
}

export class OllamaConnectionError extends OllamaProviderError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR')
    this.name = 'OllamaConnectionError'
  }
}

export class OllamaModelNotFoundError extends OllamaProviderError {
  constructor(model: string) {
    super(`Model "${model}" not found`, 'MODEL_NOT_FOUND')
    this.name = 'OllamaModelNotFoundError'
  }
}

export class OllamaTimeoutError extends OllamaProviderError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR')
    this.name = 'OllamaTimeoutError'
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

/**
 * Model cache entry
 */
interface ModelCacheEntry {
  models: string[]
  timestamp: number
}

/**
 * Logger interface for dependency injection
 */
interface Logger {
  info(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  debug(message: string, meta?: Record<string, any>): void
}

/**
 * Simple console-based logger
 */
class ConsoleLogger implements Logger {
  private prefix: string

  constructor(prefix: string = 'OllamaProvider') {
    this.prefix = prefix
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(`[${this.prefix}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[${this.prefix}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[${this.prefix}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[${this.prefix}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '')
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Ollama Provider (Local Models)
 */
export class OllamaProvider implements ILLMProvider {
  readonly name = 'ollama'

  private baseUrl: string
  private timeout: number
  private retryConfig: RetryConfig
  private cacheTTL: number
  private modelCache: ModelCacheEntry | null
  private logger: Logger

  constructor(
    baseUrl?: string,
    timeout: number = 60000,
    cacheTTL: number = 300000,
    retryConfig: RetryConfig = { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 },
    logger?: Logger
  ) {
    this.baseUrl = baseUrl || 'http://localhost:11434'
    this.timeout = timeout
    this.cacheTTL = cacheTTL
    this.modelCache = null
    this.retryConfig = retryConfig
    this.logger = logger || new ConsoleLogger('OllamaProvider')
  }

  /**
   * Chat completion with streaming support
   */
  async *chat(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): AsyncIterable<ChatCompletionChunk> {
    const requestId = generateRequestId()
    const startTime = Date.now()

    const model = config.model || 'qwen2.5:7b'

    this.logger.info('Starting chat request', {
      requestId,
      model,
      messageCount: request.messages.length,
    })

    let totalEvalCount = 0
    let totalPromptEvalCount = 0

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
          body: JSON.stringify({
            model,
            messages: this.normalizeMessages(request.messages),
            stream: true,
            options: {
              temperature: request.temperature ?? config.temperature ?? 0.7,
              num_predict: request.maxTokens ?? config.maxTokens ?? 2048,
            },
          }),
        },
        requestId
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage: string

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorText
          if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            this.logger.error('Model not found', { requestId, model })
            throw new OllamaModelNotFoundError(model)
          }
        } catch {
          errorMessage = errorText
        }

        const error = new OllamaProviderError(
          `Ollama API error: ${errorMessage}`,
          'API_ERROR',
          response.status
        )
        this.logger.error('API error response', {
          requestId,
          statusCode: response.status,
          error: errorMessage,
        })
        throw error
      }

      const reader = response.body?.getReader()
      if (!reader) {
        const error = new OllamaConnectionError('No response body')
        this.logger.error('No response body', { requestId })
        throw error
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line)
              const content = parsed.message?.content || ''

              // Accumulate token counts
              if (parsed.eval_count) {
                totalEvalCount = parsed.eval_count
              }
              if (parsed.prompt_eval_count) {
                totalPromptEvalCount = parsed.prompt_eval_count
              }

              if (content) {
                yield {
                  content,
                  finishReason: parsed.done ? 'stop' : null,
                }
              }
            } catch (e) {
              this.logger.warn('Failed to parse Ollama response chunk', {
                requestId,
                error: e,
                line,
              })
            }
          }
        }
      }

      const duration = Date.now() - startTime
      this.logger.info('Chat request completed', {
        requestId,
        duration,
        usage: {
          promptTokens: totalPromptEvalCount,
          completionTokens: totalEvalCount,
          totalTokens: totalPromptEvalCount + totalEvalCount,
        },
      })
    } catch (error) {
      const duration = Date.now() - startTime
      if (error instanceof OllamaProviderError) {
        throw error
      }
      const connectionError = new OllamaConnectionError(
        error instanceof Error ? error.message : 'Unknown connection error'
      )
      this.logger.error('Chat request failed', {
        requestId,
        duration,
        error: connectionError.message,
      })
      throw connectionError
    }
  }

  /**
   * Chat completion without streaming
   */
  async chatComplete(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    const requestId = generateRequestId()
    const startTime = Date.now()

    const model = config.model || 'qwen2.5:7b'

    this.logger.info('Starting chat complete request', {
      requestId,
      model,
      messageCount: request.messages.length,
    })

    try {
      const response = await this.fetchWithRetry(
        () =>
          fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId,
            },
            body: JSON.stringify({
              model,
              messages: this.normalizeMessages(request.messages),
              stream: false,
              options: {
                temperature: request.temperature ?? config.temperature ?? 0.7,
                num_predict: request.maxTokens ?? config.maxTokens ?? 2048,
              },
            }),
          }),
        requestId
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage: string

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorText
          if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            this.logger.error('Model not found', { requestId, model })
            throw new OllamaModelNotFoundError(model)
          }
        } catch {
          errorMessage = errorText
        }

        const error = new OllamaProviderError(
          `Ollama API error: ${errorMessage}`,
          'API_ERROR',
          response.status
        )
        this.logger.error('API error response', {
          requestId,
          statusCode: response.status,
          error: errorMessage,
        })
        throw error
      }

      const data: any = await response.json()
      const duration = Date.now() - startTime

      this.logger.info('Chat complete request completed', {
        requestId,
        duration,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      })

      return {
        content: data.message?.content || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      }
    } catch (error) {
      const duration = Date.now() - startTime
      if (error instanceof OllamaProviderError) {
        throw error
      }
      const connectionError = new OllamaConnectionError(
        error instanceof Error ? error.message : 'Unknown connection error'
      )
      this.logger.error('Chat complete request failed', {
        requestId,
        duration,
        error: connectionError.message,
      })
      throw connectionError
    }
  }

  /**
   * List available models with caching
   */
  async listModels(): Promise<string[]> {
    const cacheKey = 'models'

    // Check cache first
    if (this.modelCache && Date.now() - this.modelCache.timestamp < this.cacheTTL) {
      this.logger.debug('Returning cached model list', {
        age: Date.now() - this.modelCache.timestamp,
        ttl: this.cacheTTL,
      })
      return this.modelCache.models
    }

    const requestId = generateRequestId()
    this.logger.info('Fetching model list', { requestId })

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        {
          method: 'GET',
          headers: {
            'X-Request-ID': requestId,
          },
        },
        requestId
      )

      if (!response.ok) {
        this.logger.warn('Failed to fetch model list', {
          requestId,
          statusCode: response.status,
        })
        return []
      }

      const data: any = await response.json()
      const models = data.models?.map((m: any) => m.name) || []

      // Update cache
      this.modelCache = {
        models,
        timestamp: Date.now(),
      }

      this.logger.info('Model list fetched successfully', {
        requestId,
        count: models.length,
      })

      return models
    } catch (error) {
      this.logger.error('Failed to fetch model list', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return []
    }
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.modelCache = null
    this.logger.debug('Model cache cleared')
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    requestId: string
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn('Request timeout', { requestId, timeout: this.timeout })
        throw new OllamaTimeoutError(`Request timeout after ${this.timeout}ms`)
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error('Connection error', { requestId, error: error.message })
        throw new OllamaConnectionError(`Cannot connect to Ollama at ${this.baseUrl}`)
      }
      throw error
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    fetchFn: () => Promise<Response>,
    requestId: string
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetchFn()
        if (response.ok || attempt === this.retryConfig.maxRetries) {
          return response
        }
        lastError = new Error(`HTTP ${response.status}`)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on model not found errors
        if (error instanceof OllamaModelNotFoundError) {
          throw error
        }

        // Don't retry on connection errors (service not running)
        if (error instanceof OllamaConnectionError) {
          throw error
        }
      }

      if (attempt < this.retryConfig.maxRetries) {
        const delay = calculateBackoff(
          attempt,
          this.retryConfig.baseDelay,
          this.retryConfig.maxDelay
        )
        this.logger.warn('Retrying request', {
          requestId,
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          delay,
          error: lastError?.message,
        })
        await sleep(delay)
      }
    }

    throw lastError || new Error('Unknown error')
  }

  /**
   * Normalize messages to ensure proper format
   */
  private normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content || '',
      ...(msg.name && { name: msg.name }),
    }))
  }
}
