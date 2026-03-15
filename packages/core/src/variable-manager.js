"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableManager = exports.VariableScope = void 0;
var VariableScope;
(function (VariableScope) {
    VariableScope["GLOBAL"] = "global";
    VariableScope["NODE"] = "node";
    VariableScope["SYSTEM"] = "system";
})(VariableScope || (exports.VariableScope = VariableScope = {}));
class VariableManager {
    context;
    nodeVariables = new Map();
    constructor(context) {
        this.context = context;
        this.setSystemVariable('workflowId', context.workflowId);
        this.setSystemVariable('runId', context.runId);
        this.setSystemVariable('startTime', context.startTime.toISOString());
    }
    getVariable(name) {
        if (this.context.currentNodeId) {
            const nodeVars = this.nodeVariables.get(this.context.currentNodeId);
            if (nodeVars && name in nodeVars) {
                return nodeVars[name];
            }
        }
        const value = this.getNestedValue(this.context.variables, name);
        if (value !== undefined) {
            return value;
        }
        return this.getNestedValue(this.context.variables, `__system.${name}`);
    }
    setVariable(name, value, scope = VariableScope.GLOBAL) {
        if (scope === VariableScope.NODE && this.context.currentNodeId) {
            const nodeVars = this.nodeVariables.get(this.context.currentNodeId) || {};
            nodeVars[name] = value;
            this.nodeVariables.set(this.context.currentNodeId, nodeVars);
        }
        else {
            this.setNestedValue(this.context.variables, name, value);
        }
    }
    setSystemVariable(name, value) {
        this.setVariable(`__system.${name}`, value);
    }
    getAllVariables() {
        return {
            ...this.context.variables,
            ...this.context.nodeOutputs,
        };
    }
    getNodeOutput(nodeId) {
        return this.context.nodeOutputs[nodeId];
    }
    setNodeOutput(nodeId, output) {
        this.context.nodeOutputs[nodeId] = output;
        this.setVariable(`nodes.${nodeId}`, output);
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((acc, part) => {
            if (!(part in acc)) {
                acc[part] = {};
            }
            return acc[part];
        }, obj);
        target[last] = value;
    }
}
exports.VariableManager = VariableManager;
//# sourceMappingURL=variable-manager.js.map