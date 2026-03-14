"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
class OllamaProvider {
    name = 'ollama';
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'http://localhost:11434';
    }
    async *chat(request, config) {
        const model = config.model || 'qwen2.5:7b';
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: request.messages,
                    stream: true,
                    options: {
                        temperature: request.temperature ?? config.temperature ?? 0.7,
                        num_predict: request.maxTokens ?? config.maxTokens ?? 2048,
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API error: ${error}`);
            }
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
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
                            if (content) {
                                yield {
                                    content,
                                    finishReason: parsed.done ? 'stop' : null,
                                };
                            }
                        }
                        catch (e) {
                            console.error('Failed to parse Ollama response:', e);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Ollama provider error:', error);
            throw error;
        }
    }
    async chatComplete(request, config) {
        const model = config.model || 'qwen2.5:7b';
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: request.messages,
                stream: false,
                options: {
                    temperature: request.temperature ?? config.temperature ?? 0.7,
                    num_predict: request.maxTokens ?? config.maxTokens ?? 2048,
                },
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${error}`);
        }
        const data = await response.json();
        return {
            content: data.message?.content || '',
            usage: {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            },
        };
    }
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return data.models?.map((m) => m.name) || [];
        }
        catch {
            return [];
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama-provider.js.map