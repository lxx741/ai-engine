"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
exports.getProviderFactory = getProviderFactory;
const aliyun_provider_1 = require("./aliyun-provider");
const ollama_provider_1 = require("./ollama-provider");
class ProviderFactory {
    providers = new Map();
    constructor() {
        this.registerProvider('aliyun', new aliyun_provider_1.AliyunProvider());
        this.registerProvider('ollama', new ollama_provider_1.OllamaProvider());
    }
    getProvider(type) {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider "${type}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
        }
        return provider;
    }
    registerProvider(type, provider) {
        this.providers.set(type, provider);
    }
    listProviders() {
        return Array.from(this.providers.keys());
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
//# sourceMappingURL=provider-factory.js.map