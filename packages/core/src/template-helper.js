"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateHelper = void 0;
const shared_1 = require("@ai-engine/shared");
class TemplateHelper {
    variableManager;
    constructor(variableManager) {
        this.variableManager = variableManager;
    }
    parse(template) {
        const variables = this.variableManager.getAllVariables();
        return (0, shared_1.parseTemplate)(template, variables);
    }
    parseObject(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = this.parse(value);
            }
            else if (typeof value === 'object' && value !== null) {
                result[key] = this.parseObject(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    parseArray(arr) {
        return arr.map(item => {
            if (typeof item === 'string') {
                return this.parse(item);
            }
            else if (typeof item === 'object' && item !== null) {
                return this.parseObject(item);
            }
            return item;
        });
    }
}
exports.TemplateHelper = TemplateHelper;
//# sourceMappingURL=template-helper.js.map