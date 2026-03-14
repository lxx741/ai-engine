/**
 * 模板工具函数
 */

/**
 * Parse template variables like {{ variable }}
 * @param template Template string with variables
 * @param variables Variables object
 * @returns Parsed template string
 */
export function parseTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const value = getNestedValue(variables, key.trim());
    return value !== undefined ? String(value) : '';
  });
}

/**
 * Get nested value from object using dot notation
 * @param obj Object to search
 * @param path Dot notation path (e.g., "user.name")
 * @returns Value at path or undefined
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
