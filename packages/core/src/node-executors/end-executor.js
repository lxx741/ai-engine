"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndNodeExecutor = void 0;
class EndNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'end';
    }
    async execute(config, context) {
        try {
            const outputVariables = config.variables || [];
            const output = {};
            for (const varName of outputVariables) {
                output[varName] = context.variables[varName];
            }
            return {
                success: true,
                output: {
                    message: 'Workflow completed',
                    output,
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
}
exports.EndNodeExecutor = EndNodeExecutor;
//# sourceMappingURL=end-executor.js.map