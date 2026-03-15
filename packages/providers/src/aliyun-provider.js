"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliyunProvider = exports.AliyunTimeoutError = exports.AliyunAPIError = exports.AliyunNetworkError = exports.AliyunProviderError = void 0;
class AliyunProviderError extends Error {
    code;
    statusCode;
    requestId;
    constructor(message, code, statusCode, requestId) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.requestId = requestId;
        this.name = 'AliyunProviderError';
    }
}
exports.AliyunProviderError = AliyunProviderError;
class AliyunNetworkError extends AliyunProviderError {
    constructor(message, requestId) {
        super(message, 'NETWORK_ERROR', undefined, requestId);
        this.name = 'AliyunNetworkError';
    }
}
exports.AliyunNetworkError = AliyunNetworkError;
class AliyunAPIError extends AliyunProviderError {
    constructor(message, code, statusCode, requestId) {
        super(message, code, statusCode, requestId);
        this.name = 'AliyunAPIError';
    }
}
exports.AliyunAPIError = AliyunAPIError;
class AliyunTimeoutError extends AliyunProviderError {
    constructor(message, requestId) {
        super(message, 'TIMEOUT_ERROR', undefined, requestId);
        this.name = 'AliyunTimeoutError';
    }
}
exports.AliyunTimeoutError = AliyunTimeoutError;
class ConsoleLogger {
    prefix;
    constructor(prefix = 'AliyunProvider') {
        this.prefix = prefix;
    }
    info(message, meta) {
        console.log(`[${this.prefix}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    }
    error(message, meta) {
        console.error(`[${this.prefix}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
    }
    warn(message, meta) {
        console.warn(`[${this.prefix}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    }
    debug(message, meta) {
        console.debug(`[${this.prefix}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
}
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function calculateBackoff(attempt, baseDelay, maxDelay) {
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
}
class AliyunProvider {
    name = 'aliyun';
    baseUrl;
    timeout;
    retryConfig;
    logger;
    constructor(baseUrl, timeout = 30000, retryConfig = { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 }, logger) {
        this.baseUrl = baseUrl || 'https://dashscope.aliyuncs.com/api/v1';
        this.timeout = timeout;
        this.retryConfig = retryConfig;
        this.logger = logger || new ConsoleLogger('AliyunProvider');
    }
    async *chat(request, config) {
        const requestId = generateRequestId();
        const startTime = Date.now();
        this.logger.info('Starting chat request', {
            requestId,
            model: config.model,
            messageCount: request.messages.length,
        });
        const apiKey = config.apiKey;
        if (!apiKey) {
            const error = new AliyunProviderError('Aliyun API key is required', 'MISSING_API_KEY');
            this.logger.error('Missing API key', { requestId });
            throw error;
        }
        const model = config.model || 'qwen-turbo';
        let lastUsage = null;
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/services/aigc/text-generation/generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'X-Request-ID': requestId,
                },
                body: JSON.stringify({
                    model,
                    input: {
                        messages: this.normalizeMessages(request.messages),
                    },
                    parameters: {
                        temperature: request.temperature ?? config.temperature ?? 0.7,
                        max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
                        result_format: 'message',
                    },
                    stream: true,
                }),
            }, requestId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                }
                catch {
                    errorData = { message: errorText };
                }
                const error = new AliyunAPIError(errorData.message || 'Aliyun API error', errorData.code || 'API_ERROR', response.status, requestId);
                this.logger.error('API error response', {
                    requestId,
                    statusCode: response.status,
                    error: errorData,
                });
                throw error;
            }
            const reader = response.body?.getReader();
            if (!reader) {
                const error = new AliyunNetworkError('No response body', requestId);
                this.logger.error('No response body', { requestId });
                throw error;
            }
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            const choice = parsed.output?.choices?.[0];
                            const content = choice?.message?.content || '';
                            if (parsed.usage) {
                                lastUsage = parsed.usage;
                            }
                            if (content) {
                                yield {
                                    content,
                                    finishReason: choice?.finish_reason || null,
                                };
                            }
                        }
                        catch (e) {
                            this.logger.warn('Failed to parse Aliyun response chunk', {
                                requestId,
                                error: e,
                                line,
                            });
                        }
                    }
                }
            }
            const duration = Date.now() - startTime;
            this.logger.info('Chat request completed', {
                requestId,
                duration,
                usage: lastUsage,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof AliyunProviderError) {
                throw error;
            }
            const networkError = new AliyunNetworkError(error instanceof Error ? error.message : 'Unknown network error', requestId);
            this.logger.error('Chat request failed', {
                requestId,
                duration,
                error: networkError.message,
            });
            throw networkError;
        }
    }
    async chatComplete(request, config) {
        const requestId = generateRequestId();
        const startTime = Date.now();
        this.logger.info('Starting chat complete request', {
            requestId,
            model: config.model,
            messageCount: request.messages.length,
        });
        const apiKey = config.apiKey;
        if (!apiKey) {
            const error = new AliyunProviderError('Aliyun API key is required', 'MISSING_API_KEY');
            this.logger.error('Missing API key', { requestId });
            throw error;
        }
        const model = config.model || 'qwen-turbo';
        try {
            const response = await this.fetchWithRetry(() => fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'X-Request-ID': requestId,
                },
                body: JSON.stringify({
                    model,
                    input: {
                        messages: this.normalizeMessages(request.messages),
                    },
                    parameters: {
                        temperature: request.temperature ?? config.temperature ?? 0.7,
                        max_tokens: request.maxTokens ?? config.maxTokens ?? 2048,
                        result_format: 'message',
                    },
                }),
            }), requestId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                }
                catch {
                    errorData = { message: errorText };
                }
                const error = new AliyunAPIError(errorData.message || 'Aliyun API error', errorData.code || 'API_ERROR', response.status, requestId);
                this.logger.error('API error response', {
                    requestId,
                    statusCode: response.status,
                    error: errorData,
                });
                throw error;
            }
            const data = await response.json();
            const duration = Date.now() - startTime;
            this.logger.info('Chat complete request completed', {
                requestId,
                duration,
                usage: data.usage,
            });
            return {
                content: data.output?.choices?.[0]?.message?.content || '',
                usage: data.usage
                    ? {
                        promptTokens: data.usage.input_tokens || 0,
                        completionTokens: data.usage.output_tokens || 0,
                        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
                    }
                    : undefined,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof AliyunProviderError) {
                throw error;
            }
            const networkError = new AliyunNetworkError(error instanceof Error ? error.message : 'Unknown network error', requestId);
            this.logger.error('Chat complete request failed', {
                requestId,
                duration,
                error: networkError.message,
            });
            throw networkError;
        }
    }
    async fetchWithTimeout(url, options, requestId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.warn('Request timeout', { requestId, timeout: this.timeout });
                throw new AliyunTimeoutError(`Request timeout after ${this.timeout}ms`, requestId);
            }
            throw error;
        }
    }
    async fetchWithRetry(fetchFn, requestId) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const response = await fetchFn();
                if (response.ok || attempt === this.retryConfig.maxRetries) {
                    return response;
                }
                lastError = new Error(`HTTP ${response.status}`);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (error instanceof AliyunAPIError && error.statusCode && error.statusCode < 500) {
                    throw error;
                }
            }
            if (attempt < this.retryConfig.maxRetries) {
                const delay = calculateBackoff(attempt, this.retryConfig.baseDelay, this.retryConfig.maxDelay);
                this.logger.warn('Retrying request', {
                    requestId,
                    attempt: attempt + 1,
                    maxRetries: this.retryConfig.maxRetries,
                    delay,
                    error: lastError?.message,
                });
                await sleep(delay);
            }
        }
        throw lastError || new Error('Unknown error');
    }
    normalizeMessages(messages) {
        return messages.map((msg) => ({
            role: msg.role,
            content: msg.content || '',
            ...(msg.name && { name: msg.name }),
        }));
    }
}
exports.AliyunProvider = AliyunProvider;
//# sourceMappingURL=aliyun-provider.js.map