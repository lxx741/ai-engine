import { ILLMProvider, IProviderFactory } from '@ai-engine/core';
export declare class ProviderFactory implements IProviderFactory {
    private providers;
    constructor();
    getProvider(type: string): ILLMProvider;
    registerProvider(type: string, provider: ILLMProvider): void;
    listProviders(): string[];
}
export declare function getProviderFactory(): ProviderFactory;
