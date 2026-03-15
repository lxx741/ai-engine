import { ILLMProvider, IProviderFactory } from '@ai-engine/core';
import { ModelConfig } from '@ai-engine/shared';
interface ProviderConfig {
    baseUrl?: string;
    apiKey?: string;
    timeout?: number;
    [key: string]: any;
}
interface HealthCheckResult {
    provider: string;
    healthy: boolean;
    error?: string;
    responseTime?: number;
}
interface ModelRoutingRule {
    pattern: string | RegExp;
    provider: string;
    model?: string;
}
export declare class ProviderFactory implements IProviderFactory {
    private providers;
    private providerConfigs;
    private routingRules;
    private healthCheckCache;
    private healthCheckTTL;
    constructor();
    private initializeDefaultProviders;
    getProvider(type: string): ILLMProvider;
    registerProvider(type: string, provider: ILLMProvider, config?: ProviderConfig): void;
    listProviders(): string[];
    getProviderConfig(type: string): ProviderConfig | undefined;
    updateProviderConfig(type: string, config: Partial<ProviderConfig>): void;
    addRoutingRule(rule: ModelRoutingRule): void;
    clearRoutingRules(): void;
    getProviderForModel(modelId: string): ILLMProvider;
    getModelName(modelId: string): string;
    healthCheck(providerType: string): Promise<HealthCheckResult>;
    healthCheckAll(): Promise<Map<string, HealthCheckResult>>;
    clearHealthCheckCache(): void;
    createModelConfig(modelId: string, overrides?: Partial<ModelConfig>): ModelConfig;
}
export declare function getProviderFactory(): ProviderFactory;
export declare function resetProviderFactory(): void;
export {};
