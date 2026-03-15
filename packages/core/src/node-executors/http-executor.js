"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPNodeExecutor = void 0;
const shared_1 = require("@ai-engine/shared");
class HTTPNodeExecutor {
    canExecute(nodeType) {
        return nodeType === 'http';
    }
    async execute(config, context) {
        try {
            const startTime = Date.now();
            const urlTemplate = config.url || '';
            const url = (0, shared_1.parseTemplate)(urlTemplate, context.variables);
            let body;
            if (config.body) {
                body = (0, shared_1.parseTemplate)(config.body, context.variables);
            }
            const headers = {};
            if (config.headers) {
                for (const [key, value] of Object.entries(config.headers)) {
                    headers[key] = (0, shared_1.parseTemplate)(value, context.variables);
                }
            }
            const response = await fetch(url, {
                method: config.method || 'GET',
                headers,
                body: config.method !== 'GET' ? body : undefined,
            });
            const responseData = await response.json();
            const duration = Date.now() - startTime;
            return {
                success: response.ok,
                output: {
                    status: response.status,
                    data: responseData,
                    headers: Object.fromEntries(response.headers.entries()),
                    duration,
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
exports.HTTPNodeExecutor = HTTPNodeExecutor;
//# sourceMappingURL=http-executor.js.map