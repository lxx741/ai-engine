import { WorkflowExecutionContext } from '@ai-engine/shared';

export enum VariableScope {
  GLOBAL = 'global',
  NODE = 'node',
  SYSTEM = 'system',
}

export class VariableManager {
  private context: WorkflowExecutionContext;
  private nodeVariables: Map<string, Record<string, any>> = new Map();

  constructor(context: WorkflowExecutionContext) {
    this.context = context;
    
    this.setSystemVariable('workflowId', context.workflowId);
    this.setSystemVariable('runId', context.runId);
    this.setSystemVariable('startTime', context.startTime.toISOString());
  }

  getVariable(name: string): any {
    if (this.context.currentNodeId) {
      const nodeVars = this.nodeVariables.get(this.context.currentNodeId);
      if (nodeVars && name in nodeVars) {
        return nodeVars[name];
      }
    }

    const value = this.getNestedValue(this.context.variables, name);
    if (value !== undefined) {
      return value;
    }

    return this.getNestedValue(this.context.variables, `__system.${name}`);
  }

  setVariable(name: string, value: any, scope: VariableScope = VariableScope.GLOBAL): void {
    if (scope === VariableScope.NODE && this.context.currentNodeId) {
      const nodeVars = this.nodeVariables.get(this.context.currentNodeId) || {};
      nodeVars[name] = value;
      this.nodeVariables.set(this.context.currentNodeId, nodeVars);
    } else {
      this.setNestedValue(this.context.variables, name, value);
    }
  }

  private setSystemVariable(name: string, value: any): void {
    this.setVariable(`__system.${name}`, value);
  }

  getAllVariables(): Record<string, any> {
    return {
      ...this.context.variables,
      ...this.context.nodeOutputs,
    };
  }

  getNodeOutput(nodeId: string): any {
    return this.context.nodeOutputs[nodeId];
  }

  setNodeOutput(nodeId: string, output: any): void {
    this.context.nodeOutputs[nodeId] = output;
    
    this.setVariable(`nodes.${nodeId}`, output);
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    
    const target = parts.reduce((acc, part) => {
      if (!(part in acc)) {
        acc[part] = {};
      }
      return acc[part];
    }, obj as Record<string, any>);
    
    target[last] = value;
  }
}
