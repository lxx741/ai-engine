import { WorkflowExecutionContext } from '@ai-engine/shared';
export declare enum VariableScope {
    GLOBAL = "global",
    NODE = "node",
    SYSTEM = "system"
}
export declare class VariableManager {
    private context;
    private nodeVariables;
    constructor(context: WorkflowExecutionContext);
    getVariable(name: string): any;
    setVariable(name: string, value: any, scope?: VariableScope): void;
    private setSystemVariable;
    getAllVariables(): Record<string, any>;
    getNodeOutput(nodeId: string): any;
    setNodeOutput(nodeId: string, output: any): void;
    private getNestedValue;
    private setNestedValue;
}
