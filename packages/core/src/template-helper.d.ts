import { VariableManager } from './variable-manager';
export declare class TemplateHelper {
    private variableManager;
    constructor(variableManager: VariableManager);
    parse(template: string): string;
    parseObject<T extends Record<string, any>>(obj: T): T;
    parseArray<T extends any[]>(arr: T): T;
}
