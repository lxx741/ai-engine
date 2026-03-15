export declare function parseTemplate(template: string, variables: Record<string, any>, options?: {
    strict?: boolean;
    escapeHtml?: boolean;
}): string;
export declare function getNestedValue(obj: Record<string, any>, path: string): any;
