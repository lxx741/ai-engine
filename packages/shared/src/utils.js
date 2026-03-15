"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTemplate = parseTemplate;
exports.getNestedValue = getNestedValue;
function parseTemplate(template, variables, options) {
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
        }
        catch (error) {
            if (strict) {
                throw error;
            }
            return match;
        }
    });
}
function evaluateExpression(expression, variables) {
    const evaluated = expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
        const value = getNestedValue(variables, key.trim());
        return JSON.stringify(value);
    });
    try {
        const func = new Function('variables', 'getNestedValue', `with (variables) { return ${evaluated}; }`);
        return func(variables, getNestedValue);
    }
    catch {
        return undefined;
    }
}
function escapeHtmlEntities(str) {
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}
function getNestedValue(obj, path) {
    if (!obj || !path)
        return undefined;
    return path.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined)
            return undefined;
        return acc[part];
    }, obj);
}
//# sourceMappingURL=utils.js.map