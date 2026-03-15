"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
exports.getProviderFactory = getProviderFactory;
exports.resetProviderFactory = resetProviderFactory;
if (typeof process !== 'undefined') {
    try {
        const path = require('path');
        const dotenv = require('dotenv');
        const possiblePaths = [
            path.join(process.cwd(), '.env.local'),
            path.join(__dirname, '../../.env.local'),
            path.join(__dirname, '../../../.env.local'),
        ];
        for (const envPath of possiblePaths) {
            try {
                const result = dotenv.config({ path: envPath });
                if (result.parsed && result.parsed.ALIYUN_API_KEY) {
                    console.log(`[ProviderFactory] Loaded .env.local from ${envPath}`);
                    break;
                }
            }
            catch (e) {
            }
        }
    }
    catch (e) {
    }
}
const aliyun_provider_1 = require("./aliyun-provider");
const ollama_provider_1 = require("./ollama-provider");
class ProviderFactory {
    providers = new Map();
    providerConfigs = new Map();
    routingRules = [];
    healthCheckCache = new Map();
    healthCheckTTL = 60000;
    constructor() {
        this.initializeDefaultProviders();
    }
    initializeDefaultProviders() {
        const aliyunBaseUrl = process.env.ALIYUN_BASE_URL;
        const aliyunApiKey = process.env.ALIYUN_API_KEY;
        const aliyunTimeout = process.env.ALIYUN_TIMEOUT
            ? parseInt(process.env.ALIYUN_TIMEOUT, 10)
            : undefined;
        const aliyunConfig = {};
        if (aliyunBaseUrl)
            aliyunConfig.baseUrl = aliyunBaseUrl;
        if (aliyunApiKey)
            aliyunConfig.apiKey = aliyunApiKey;
        if (aliyunTimeout)
            aliyunConfig.timeout = aliyunTimeout;
        this.registerProvider('aliyun', new aliyun_provider_1.AliyunProvider(aliyunConfig.baseUrl, aliyunConfig.timeout || 30000), aliyunConfig);
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
        const ollamaTimeout = process.env.OLLAMA_TIMEOUT
            ? parseInt(process.env.OLLAMA_TIMEOUT, 10)
            : undefined;
        const ollamaCacheTTL = process.env.OLLAMA_CACHE_TTL
            ? parseInt(process.env.OLLAMA_CACHE_TTL, 10)
            : undefined;
        const ollamaConfig = {};
        if (ollamaBaseUrl)
            ollamaConfig.baseUrl = ollamaBaseUrl;
        if (ollamaTimeout)
            ollamaConfig.timeout = ollamaTimeout;
        if (ollamaCacheTTL)
            ollamaConfig.cacheTTL = ollamaCacheTTL;
        this.registerProvider('ollama', new ollama_provider_1.OllamaProvider(ollamaConfig.baseUrl, ollamaConfig.timeout || 60000, ollamaConfig.cacheTTL || 300000), ollamaConfig);
    }
    getProvider(type) {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider "${type}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
        }
        return provider;
    }
    registerProvider(type, provider, config) {
        this.providers.set(type, provider);
        if (config) {
            this.providerConfigs.set(type, config);
        }
    }
    listProviders() {
        return Array.from(this.providers.keys());
    }
    getProviderConfig(type) {
        return this.providerConfigs.get(type);
    }
    updateProviderConfig(type, config) {
        const existing = this.providerConfigs.get(type) || {};
        this.providerConfigs.set(type, { ...existing, ...config });
    }
    addRoutingRule(rule) {
        this.routingRules.push(rule);
    }
    clearRoutingRules() {
        this.routingRules = [];
    }
    getProviderForModel(modelId) {
        for (const rule of this.routingRules) {
            const matches = typeof rule.pattern === 'string'
                ? modelId === rule.pattern
                : rule.pattern.test(modelId);
            if (matches) {
                return this.getProvider(rule.provider);
            }
        }
        const colonMatch = modelId.match(/^([^:]+):(.+)$/);
        const slashMatch = modelId.match(/^([^/]+)\/(.+)$/);
        if (colonMatch) {
            const [, provider] = colonMatch;
            if (this.providers.has(provider)) {
                return this.getProvider(provider);
            }
        }
        if (slashMatch) {
            const [, provider] = slashMatch;
            if (this.providers.has(provider)) {
                return this.getProvider(provider);
            }
        }
        const firstProvider = this.providers.keys().next().value;
        if (firstProvider) {
            return this.getProvider(firstProvider);
        }
        throw new Error(`No provider available for model: ${modelId}`);
    }
    getModelName(modelId) {
        const colonMatch = modelId.match(/^([^:]+):(.+)$/);
        const slashMatch = modelId.match(/^([^/]+)\/(.+)$/);
        if (colonMatch) {
            return colonMatch[2];
        }
        if (slashMatch) {
            return slashMatch[2];
        }
        return modelId;
    }
    async healthCheck(providerType) {
        const cached = this.healthCheckCache.get(providerType);
        if (cached && Date.now() - (cached.responseTime || 0) < this.healthCheckTTL) {
            return cached;
        }
        const startTime = Date.now();
        const provider = this.providers.get(providerType);
        if (!provider) {
            const result = {
                provider: providerType,
                healthy: false,
                error: 'Provider not found',
                responseTime: Date.now() - startTime,
            };
            this.healthCheckCache.set(providerType, result);
            return result;
        }
        try {
            if (providerType === 'ollama' && 'listModels' in provider) {
                await provider.listModels();
            }
            else if (providerType === 'aliyun') {
                const config = this.providerConfigs.get(providerType);
                if (!config?.apiKey) {
                    const result = {
                        provider: providerType,
                        healthy: false,
                        error: 'API key not configured',
                        responseTime: Date.now() - startTime,
                    };
                    this.healthCheckCache.set(providerType, result);
                    return result;
                }
            }
            const result = {
                provider: providerType,
                healthy: true,
                responseTime: Date.now() - startTime,
            };
            this.healthCheckCache.set(providerType, result);
            return result;
        }
        catch (error) {
            const result = {
                provider: providerType,
                healthy: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime: Date.now() - startTime,
            };
            this.healthCheckCache.set(providerType, result);
            return result;
        }
    }
    async healthCheckAll() {
        const results = new Map();
        for (const providerType of this.providers.keys()) {
            const result = await this.healthCheck(providerType);
            results.set(providerType, result);
        }
        return results;
    }
    clearHealthCheckCache() {
        this.healthCheckCache.clear();
    }
    createModelConfig(modelId, overrides) {
        const provider = this.getProviderForModel(modelId);
        const modelName = this.getModelName(modelId);
        const providerConfig = this.providerConfigs.get(provider.name) || {};
        return {
            provider: provider.name,
            model: modelName,
            baseUrl: providerConfig.baseUrl,
            apiKey: providerConfig.apiKey,
            ...overrides,
        };
    }
}
exports.ProviderFactory = ProviderFactory;
let factoryInstance = null;
function getProviderFactory() {
    if (!factoryInstance) {
        factoryInstance = new ProviderFactory();
    }
    return factoryInstance;
}
function resetProviderFactory() {
    factoryInstance = null;
}
//# sourceMappingURL=provider-factory.js.map