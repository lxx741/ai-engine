import { ILLMProvider } from '@ai-engine/core';
import { ChatCompletionRequest, ChatCompletionChunk, ModelConfig } from '@ai-engine/shared';
export declare class AliyunProviderError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    readonly requestId?: string | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined, requestId?: string | undefined);
}
export declare class AliyunNetworkError extends AliyunProviderError {
    constructor(message: string, requestId?: string);
}
export declare class AliyunAPIError extends AliyunProviderError {
    constructor(message: string, code: string, statusCode?: number, requestId?: string);
}
export declare class AliyunTimeoutError extends AliyunProviderError {
    constructor(message: string, requestId?: string);
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
export declare class AliyunProvider implements ILLMProvider {
    readonly name = "aliyun";
    private baseUrl;
    private timeout;
    private retryConfig;
    private logger;
    constructor(baseUrl?: string, timeout?: number, retryConfig?: RetryConfig, logger?: Logger);
    chat(request: ChatCompletionRequest, config: ModelConfig): AsyncIterable<ChatCompletionChunk>;
    chatComplete(request: ChatCompletionRequest, config: ModelConfig): Promise<{
        content: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>;
    private fetchWithTimeout;
    private fetchWithRetry;
    private normalizeMessages;
}
export {};
