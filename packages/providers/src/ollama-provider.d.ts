import { ILLMProvider } from '@ai-engine/core';
import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared';
export declare class OllamaProviderError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined);
}
export declare class OllamaConnectionError extends OllamaProviderError {
    constructor(message: string);
}
export declare class OllamaModelNotFoundError extends OllamaProviderError {
    constructor(model: string);
}
export declare class OllamaTimeoutError extends OllamaProviderError {
    constructor(message: string);
}
interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
}
interface Logger {
    info(message: string, meta?: Record<string, any>): void;
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
}
export declare class OllamaProvider implements ILLMProvider {
    readonly name = "ollama";
    private baseUrl;
    private timeout;
    private retryConfig;
    private cacheTTL;
    private modelCache;
    private logger;
    constructor(baseUrl?: string, timeout?: number, cacheTTL?: number, retryConfig?: RetryConfig, logger?: Logger);
    chat(request: ChatCompletionRequest, config: ModelConfig): AsyncIterable<ChatCompletionChunk>;
    chatComplete(request: ChatCompletionRequest, config: ModelConfig): Promise<{
        content: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>;
    listModels(): Promise<string[]>;
    clearCache(): void;
    private fetchWithTimeout;
    private fetchWithRetry;
    private normalizeMessages;
}
export {};
