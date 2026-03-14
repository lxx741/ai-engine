import { ILLMProvider } from '@ai-engine/core'
import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared'

/**
 * Aliyun Bailian (DashScope) Provider
 */
export class AliyunProvider implements ILLMProvider {
  readonly name = 'aliyun'

  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'https://dashscope.aliyuncs.com/api/v1'
  }

  async *chat(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): AsyncIterable<ChatCompletionChunk> {
    const apiKey = config.apiKey
    if (!apiKey) {
      throw new Error('Aliyun API key is required')
    }

    const model = config.model || 'qwen-turbo'

    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: {
            messages: request.messages,
          },
          parameters: {
            temperature: request.temperature ?? config.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
            result_format: 'message',
          },
          stream: true,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Aliyun API error: ${error}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
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
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.output?.choices?.[0]?.message?.content || ''
              
              if (content) {
                yield {
                  content,
                  finishReason: parsed.output?.choices?.[0]?.finish_reason,
                }
              }
            } catch (e) {
              console.error('Failed to parse Aliyun response:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Aliyun provider error:', error)
      throw error
    }
  }

  async chatComplete(
    request: ChatCompletionRequest,
    config: ModelConfig
  ): Promise<{ content: string; usage?: any }> {
    const apiKey = config.apiKey
    if (!apiKey) {
      throw new Error('Aliyun API key is required')
    }

    const model = config.model || 'qwen-turbo'

    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: {
          messages: request.messages,
        },
        parameters: {
          temperature: request.temperature ?? config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
          result_format: 'message',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Aliyun API error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.output?.choices?.[0]?.message?.content || '',
      usage: data.usage,
    }
  }
}
