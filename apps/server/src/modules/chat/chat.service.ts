import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { getProviderFactory } from '@ai-engine/providers';
import { ChatMessage } from '@ai-engine/shared';

interface StreamChunk {
  content: string;
  finishReason?: string | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private providerFactory = getProviderFactory();

  constructor(
    private prisma: PrismaService,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async send(
    message: string,
    conversationId: string,
    userId?: string,
  ): Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const conversation = await this.conversationService.findOne(conversationId);

    const history = await this.messageService.getHistory(conversationId, 10);
    const historyMessages: ChatMessage[] = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const modelId = conversation.app.modelId || 'qwen-turbo';
    const provider = this.providerFactory.getProviderForModel(modelId);
    const modelName = this.providerFactory.getModelName(modelId);
    
    // Create model config with API key from environment
    const modelConfig = this.providerFactory.createModelConfig(modelId);

    const userMessage = await this.messageService.save({
      conversationId,
      role: 'user',
      content: message,
    });

    this.logger.debug(
      `Sending message to provider: ${provider.name}, model: ${modelName}, apiKey: ${modelConfig.apiKey ? 'present' : 'MISSING'}`,
    );

    const response = await provider.chatComplete?.(
      {
        messages: [
          ...historyMessages,
          { role: 'user', content: message },
        ],
        model: modelName,
      },
      modelConfig,
    );

    if (!response) {
      throw new Error('Provider did not return a response');
    }

    await this.messageService.save({
      conversationId,
      role: 'assistant',
      content: response.content,
      tokens: response.usage?.totalTokens,
      metadata: {
        userId,
        modelId,
        provider: provider.name,
      },
    });

    this.logger.debug(
      `Message saved. Tokens used: ${response.usage?.totalTokens || 'N/A'}`,
    );

    return response;
  }

  async *sendStream(
    message: string,
    conversationId: string,
    userId?: string,
  ): AsyncGenerator<StreamChunk> {
    const conversation = await this.conversationService.findOne(conversationId);

    const history = await this.messageService.getHistory(conversationId, 10);
    const historyMessages: ChatMessage[] = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const modelId = conversation.app.modelId || 'qwen-turbo';
    const provider = this.providerFactory.getProviderForModel(modelId);
    const modelName = this.providerFactory.getModelName(modelId);

    await this.messageService.save({
      conversationId,
      role: 'user',
      content: message,
      metadata: { userId },
    });

    this.logger.debug(
      `Starting stream with provider: ${provider.name}, model: ${modelName}`,
    );

    let fullContent = '';
    let finalUsage: StreamChunk['usage'];

    try {
      const stream = provider.chat(
        {
          messages: [
            ...historyMessages,
            { role: 'user', content: message },
          ],
          model: modelName,
          stream: true,
        },
        {
          provider: provider.name as any,
          model: modelName,
        },
      );

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
        }

        if (chunk.usage) {
          finalUsage = chunk.usage;
        }

        yield {
          content: chunk.content || '',
          finishReason: chunk.finishReason,
          usage: chunk.usage,
        };
      }

      if (fullContent) {
        await this.messageService.save({
          conversationId,
          role: 'assistant',
          content: fullContent,
          tokens: finalUsage?.totalTokens,
          metadata: {
            userId,
            modelId,
            provider: provider.name,
          },
        });

        this.logger.debug(
          `Stream completed. Tokens used: ${finalUsage?.totalTokens || 'N/A'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Stream error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async calculateTokens(
    messages: ChatMessage[],
  ): Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }> {
    let promptTokens = 0;

    for (const msg of messages) {
      const roleTokens = msg.role === 'user' ? 4 : 3;
      promptTokens += roleTokens;

      const contentTokens = Math.ceil(msg.content.length / 4);
      promptTokens += contentTokens;
    }

    return {
      promptTokens,
      completionTokens: 0,
      totalTokens: promptTokens,
    };
  }
}
