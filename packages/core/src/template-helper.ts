import { parseTemplate } from '@ai-engine/shared';
import { VariableManager } from './variable-manager';

export class TemplateHelper {
  private variableManager: VariableManager;

  constructor(variableManager: VariableManager) {
    this.variableManager = variableManager;
  }

  parse(template: string): string {
    const variables = this.variableManager.getAllVariables();
    return parseTemplate(template, variables);
  }

  parseObject<T extends Record<string, any>>(obj: T): T {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.parse(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.parseObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result as T;
  }

  parseArray<T extends any[]>(arr: T): T {
    return arr.map(item => {
      if (typeof item === 'string') {
        return this.parse(item) as any;
      } else if (typeof item === 'object' && item !== null) {
        return this.parseObject(item);
      }
      return item;
    }) as T;
  }
}
