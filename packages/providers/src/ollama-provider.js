"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = exports.OllamaTimeoutError = exports.OllamaModelNotFoundError = exports.OllamaConnectionError = exports.OllamaProviderError = void 0;
class OllamaProviderError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'OllamaProviderError';
    }
}
exports.OllamaProviderError = OllamaProviderError;
class OllamaConnectionError extends OllamaProviderError {
    constructor(message) {
        super(message, 'CONNECTION_ERROR');
        this.name = 'OllamaConnectionError';
    }
}
exports.OllamaConnectionError = OllamaConnectionError;
class OllamaModelNotFoundError extends OllamaProviderError {
    constructor(model) {
        super(`Model "${model}" not found`, 'MODEL_NOT_FOUND');
        this.name = 'OllamaModelNotFoundError';
    }
}
exports.OllamaModelNotFoundError = OllamaModelNotFoundError;
class OllamaTimeoutError extends OllamaProviderError {
    constructor(message) {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'OllamaTimeoutError';
    }
}
exports.OllamaTimeoutError = OllamaTimeoutError;
class ConsoleLogger {
    prefix;
    constructor(prefix = 'OllamaProvider') {
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
class OllamaProvider {
    name = 'ollama';
    baseUrl;
    timeout;
    retryConfig;
    cacheTTL;
    modelCache;
    logger;
    constructor(baseUrl, timeout = 60000, cacheTTL = 300000, retryConfig = { maxRetries: 2, baseDelay: 1000, maxDelay: 5000 }, logger) {
        this.baseUrl = baseUrl || 'http://localhost:11434';
        this.timeout = timeout;
        this.cacheTTL = cacheTTL;
        this.modelCache = null;
        this.retryConfig = retryConfig;
        this.logger = logger || new ConsoleLogger('OllamaProvider');
    }
    async *chat(request, config) {
        const requestId = generateRequestId();
        const startTime = Date.now();
        const model = config.model || 'qwen2.5:7b';
        this.logger.info('Starting chat request', {
            requestId,
            model,
            messageCount: request.messages.length,
        });
        let totalEvalCount = 0;
        let totalPromptEvalCount = 0;
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/api/chat`, {
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
            }, requestId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorText;
                    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
                        this.logger.error('Model not found', { requestId, model });
                        throw new OllamaModelNotFoundError(model);
                    }
                }
                catch {
                    errorMessage = errorText;
                }
                const error = new OllamaProviderError(`Ollama API error: ${errorMessage}`, 'API_ERROR', response.status);
                this.logger.error('API error response', {
                    requestId,
                    statusCode: response.status,
                    error: errorMessage,
                });
                throw error;
            }
            const reader = response.body?.getReader();
            if (!reader) {
                const error = new OllamaConnectionError('No response body');
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
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            const content = parsed.message?.content || '';
                            if (parsed.eval_count) {
                                totalEvalCount = parsed.eval_count;
                            }
                            if (parsed.prompt_eval_count) {
                                totalPromptEvalCount = parsed.prompt_eval_count;
                            }
                            if (content) {
                                yield {
                                    content,
                                    finishReason: parsed.done ? 'stop' : null,
                                };
                            }
                        }
                        catch (e) {
                            this.logger.warn('Failed to parse Ollama response chunk', {
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
                usage: {
                    promptTokens: totalPromptEvalCount,
                    completionTokens: totalEvalCount,
                    totalTokens: totalPromptEvalCount + totalEvalCount,
                },
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof OllamaProviderError) {
                throw error;
            }
            const connectionError = new OllamaConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
            this.logger.error('Chat request failed', {
                requestId,
                duration,
                error: connectionError.message,
            });
            throw connectionError;
        }
    }
    async chatComplete(request, config) {
        const requestId = generateRequestId();
        const startTime = Date.now();
        const model = config.model || 'qwen2.5:7b';
        this.logger.info('Starting chat complete request', {
            requestId,
            model,
            messageCount: request.messages.length,
        });
        try {
            const response = await this.fetchWithRetry(() => fetch(`${this.baseUrl}/api/chat`, {
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
            }), requestId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorText;
                    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
                        this.logger.error('Model not found', { requestId, model });
                        throw new OllamaModelNotFoundError(model);
                    }
                }
                catch {
                    errorMessage = errorText;
                }
                const error = new OllamaProviderError(`Ollama API error: ${errorMessage}`, 'API_ERROR', response.status);
                this.logger.error('API error response', {
                    requestId,
                    statusCode: response.status,
                    error: errorMessage,
                });
                throw error;
            }
            const data = await response.json();
            const duration = Date.now() - startTime;
            this.logger.info('Chat complete request completed', {
                requestId,
                duration,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                },
            });
            return {
                content: data.message?.content || '',
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof OllamaProviderError) {
                throw error;
            }
            const connectionError = new OllamaConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
            this.logger.error('Chat complete request failed', {
                requestId,
                duration,
                error: connectionError.message,
            });
            throw connectionError;
        }
    }
    async listModels() {
        const cacheKey = 'models';
        if (this.modelCache && Date.now() - this.modelCache.timestamp < this.cacheTTL) {
            this.logger.debug('Returning cached model list', {
                age: Date.now() - this.modelCache.timestamp,
                ttl: this.cacheTTL,
            });
            return this.modelCache.models;
        }
        const requestId = generateRequestId();
        this.logger.info('Fetching model list', { requestId });
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'X-Request-ID': requestId,
                },
            }, requestId);
            if (!response.ok) {
                this.logger.warn('Failed to fetch model list', {
                    requestId,
                    statusCode: response.status,
                });
                return [];
            }
            const data = await response.json();
            const models = data.models?.map((m) => m.name) || [];
            this.modelCache = {
                models,
                timestamp: Date.now(),
            };
            this.logger.info('Model list fetched successfully', {
                requestId,
                count: models.length,
            });
            return models;
        }
        catch (error) {
            this.logger.error('Failed to fetch model list', {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    clearCache() {
        this.modelCache = null;
        this.logger.debug('Model cache cleared');
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
                throw new OllamaTimeoutError(`Request timeout after ${this.timeout}ms`);
            }
            if (error instanceof TypeError && error.message.includes('fetch')) {
                this.logger.error('Connection error', { requestId, error: error.message });
                throw new OllamaConnectionError(`Cannot connect to Ollama at ${this.baseUrl}`);
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
                if (error instanceof OllamaModelNotFoundError) {
                    throw error;
                }
                if (error instanceof OllamaConnectionError) {
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
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama-provider.js.map