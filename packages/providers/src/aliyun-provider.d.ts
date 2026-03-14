import { ILLMProvider } from '@ai-engine/core';
import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared';
export declare class AliyunProvider implements ILLMProvider {
    readonly name = "aliyun";
    private baseUrl;
    constructor(baseUrl?: string);
    chat(request: ChatCompletionRequest, config: ModelConfig): AsyncIterable<ChatCompletionChunk>;
    chatComplete(request: ChatCompletionRequest, config: ModelConfig): Promise<{
        content: string;
        usage?: any;
    }>;
}
