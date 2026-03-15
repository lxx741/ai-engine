/**
 * Parse template variables like {{ variable }} or {{ node.output }}
 * Supports:
 * - Simple variables: {{ varName }}
 * - Nested variables: {{ user.name }}
 * - Node outputs: {{ nodes.nodeId.output }}
 * - Expressions: {{ varName || 'default' }}
 */
export function parseTemplate(
  template: string,
  variables: Record<string, any>,
  options?: {
    strict?: boolean;
    escapeHtml?: boolean;
  }
): string {
  const { strict = false, escapeHtml = false } = options || {};

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    try {
      const result = evaluateExpression(expression, variables);
      
      if (result === undefined || result === null) {
        if (strict) {
          throw new Error(`Variable not found: ${expression}`);
        }
        return match;
      }

      let strValue = typeof result === 'object' 
        ? JSON.stringify(result) 
        : String(result);

      if (escapeHtml) {
        strValue = escapeHtmlEntities(strValue);
      }

      return strValue;
    } catch (error) {
      if (strict) {
        throw error;
      }
      return match;
    }
  });
}

function evaluateExpression(expression: string, variables: Record<string, any>): any {
  const evaluated = expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const value = getNestedValue(variables, key.trim());
    return JSON.stringify(value);
  });

  try {
    const func = new Function(
      'variables',
      'getNestedValue',
      `with (variables) { return ${evaluated}; }`
    );
    return func(variables, getNestedValue);
  } catch {
    return undefined;
  }
}

function escapeHtmlEntities(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

export function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[part];
  }, obj);
}
