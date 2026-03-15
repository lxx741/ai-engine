"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMNodeExecutor = void 0;
const providers_1 = require("@ai-engine/providers");
const shared_1 = require("@ai-engine/shared");
class LLMNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'llm';
    }
    async execute(config, context) {
        try {
            const startTime = Date.now();
            const providerFactory = (0, providers_1.getProviderFactory)();
            const modelId = config.modelId || 'ollama:qwen3.5:9b';
            const provider = providerFactory.getProviderForModel(modelId);
            const modelName = providerFactory.getModelName(modelId);
            const promptTemplate = config.prompt || '';
            const parsedPrompt = (0, shared_1.parseTemplate)(promptTemplate, context.variables);
            const response = await provider.chatComplete?.({
                messages: [
                    { role: 'user', content: parsedPrompt },
                ],
                model: modelName,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
            }, {
                provider: provider.name,
                model: modelName,
            });
            const duration = Date.now() - startTime;
            return {
                success: true,
                output: {
                    content: response?.content || '',
                    usage: response?.usage,
                    duration,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.LLMNodeExecutor = LLMNodeExecutor;
//# sourceMappingURL=llm-executor.js.map