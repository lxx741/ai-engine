"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartNodeExecutor = void 0;
class StartNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'start';
    }
    async execute(config, context) {
        try {
            const variables = config.variables || {};
            context.variables = {
                ...context.variables,
                ...variables,
            };
            return {
                success: true,
                output: {
                    message: 'Workflow started',
                    variables,
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
exports.StartNodeExecutor = StartNodeExecutor;
//# sourceMappingURL=start-executor.js.map