"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionNodeExecutor = void 0;
class ConditionNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'condition';
    }
    async execute(config, context) {
        try {
            const expression = config.expression || '';
            const result = this.evaluateExpression(expression, context.variables);
            return {
                success: true,
                output: {
                    result,
                    expression,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    evaluateExpression(expression, variables) {
        try {
            const evaluated = expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
                const value = this.getNestedValue(variables, key.trim());
                return JSON.stringify(value);
            });
            return new Function('return ' + evaluated)();
        }
        catch {
            return false;
        }
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }
}
exports.ConditionNodeExecutor = ConditionNodeExecutor;
//# sourceMappingURL=condition-executor.js.map