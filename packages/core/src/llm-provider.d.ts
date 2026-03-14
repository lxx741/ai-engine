import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared';
export interface ILLMProvider {
    readonly name: string;
    chat(request: ChatCompletionRequest, config: ModelConfig): AsyncIterable<ChatCompletionChunk>;
    chatComplete?(request: ChatCompletionRequest, config: ModelConfig): Promise<{
        content: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>;
    embedding?(texts: string[], config: ModelConfig): Promise<number[][]>;
    listModels?(config: ModelConfig): Promise<string[]>;
}
export interface IProviderFactory {
    getProvider(type: string): ILLMProvider;
    registerProvider(type: string, provider: ILLMProvider): void;
}
