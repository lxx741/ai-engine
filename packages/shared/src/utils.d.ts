export declare function generateApiKey(): string;
export declare function randomString(length: number): string;
export declare function sleep(ms: number): Promise<void>;
export declare function isValidJson(str: string): boolean;
export declare function parseTemplate(template: string, variables: Record<string, any>): string;
export declare function getNestedValue(obj: Record<string, any>, path: string): any;
export declare function estimateTokens(text: string): number;
