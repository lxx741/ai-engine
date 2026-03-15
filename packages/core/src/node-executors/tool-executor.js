"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolNodeExecutor = void 0;
const shared_1 = require("@ai-engine/shared");
class ToolNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'tool';
    }
    async execute(config, context) {
        try {
            const startTime = Date.now();
            const toolName = config.toolName;
            const rawParams = config.params || {};
            if (!toolName) {
                return {
                    success: false,
                    error: 'Tool name is required',
                };
            }
            const processedParams = {};
            for (const [key, value] of Object.entries(rawParams)) {
                if (typeof value === 'string') {
                    processedParams[key] = (0, shared_1.parseTemplate)(value, context.variables);
                }
                else {
                    processedParams[key] = value;
                }
            }
            const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/tools/${toolName}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(context.apiKey ? { 'X-API-Key': context.apiKey } : {}),
                },
                body: JSON.stringify({
                    params: processedParams,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || `Tool execution failed with status ${response.status}`,
                };
            }
            const duration = Date.now() - startTime;
            return {
                success: result.success,
                output: {
                    ...result.data,
                    duration,
                },
                error: result.error,
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
exports.ToolNodeExecutor = ToolNodeExecutor;
//# sourceMappingURL=tool-executor.js.map