"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutor = void 0;
exports.createWorkflowExecutor = createWorkflowExecutor;
const variable_manager_1 = require("./variable-manager");
const template_helper_1 = require("./template-helper");
const node_executors_1 = require("./node-executors");
class WorkflowExecutor {
    nodeExecutors = new Map();
    config;
    constructor(config) {
        this.config = {
            timeout: 300000,
            maxRetries: 2,
            ...config,
        };
        this.registerNodeExecutor(new node_executors_1.StartNodeExecutor());
        this.registerNodeExecutor(new node_executors_1.LLMNodeExecutor());
        this.registerNodeExecutor(new node_executors_1.HTTPNodeExecutor());
        this.registerNodeExecutor(new node_executors_1.ConditionNodeExecutor());
        this.registerNodeExecutor(new node_executors_1.EndNodeExecutor());
        this.registerNodeExecutor(new node_executors_1.ToolNodeExecutor());
    }
    registerNodeExecutor(executor) {
        const nodeType = this.getNodeTypeFromExecutor(executor);
        this.nodeExecutors.set(nodeType, executor);
    }
    async execute(definition, input, config) {
        const mergedConfig = { ...this.config, ...config };
        const runId = this.generateRunId();
        const startTime = new Date();
        const context = {
            workflowId: this.extractWorkflowId(definition),
            runId,
            variables: { ...input, ...definition.variables },
            nodeOutputs: {},
            startTime,
        };
        const variableManager = new variable_manager_1.VariableManager(context);
        const templateHelper = new template_helper_1.TemplateHelper(variableManager);
        const nodeResults = [];
        let currentNodeId = this.findStartNode(definition);
        let status = 'running';
        let error;
        try {
            while (currentNodeId && status === 'running') {
                context.currentNodeId = currentNodeId;
                const node = definition.nodes.find(n => n.id === currentNodeId);
                if (!node) {
                    throw new Error(`Node not found: ${currentNodeId}`);
                }
                const nodeResult = await this.executeNodeWithTimeout(node, context, templateHelper, mergedConfig);
                nodeResults.push(nodeResult);
                if (!nodeResult.success) {
                    status = 'failed';
                    error = nodeResult.error;
                    break;
                }
                variableManager.setNodeOutput(node.id, nodeResult.output);
                currentNodeId = this.findNextNode(definition, node.id, nodeResult.output);
            }
            if (status === 'running') {
                status = 'success';
            }
        }
        catch (err) {
            status = 'failed';
            error = err instanceof Error ? err.message : 'Unknown error';
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        return {
            runId,
            workflowId: context.workflowId,
            status,
            output: context.nodeOutputs,
            error,
            nodeResults,
            duration,
            startTime,
            endTime,
        };
    }
    async executeNode(nodeType, nodeConfig, context) {
        const executor = this.nodeExecutors.get(nodeType);
        if (!executor) {
            throw new Error(`No executor found for node type: ${nodeType}`);
        }
        const startTime = Date.now();
        try {
            const output = await executor.execute(nodeConfig, context);
            const duration = Date.now() - startTime;
            return {
                nodeId: context.currentNodeId || 'unknown',
                success: output.success,
                output: output.output,
                error: output.error,
                duration,
                timestamp: new Date(),
            };
        }
        catch (err) {
            return {
                nodeId: context.currentNodeId || 'unknown',
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
                duration: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
    }
    async executeNodeWithTimeout(node, context, templateHelper, config) {
        const timeout = node.config.timeout || config.timeout || 300000;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Node execution timeout: ${timeout}ms`)), timeout);
        });
        const executionPromise = this.executeNode(node.type, node.config, context);
        return Promise.race([executionPromise, timeoutPromise]);
    }
    findStartNode(definition) {
        const startNode = definition.nodes.find(n => n.type === 'start');
        return startNode ? startNode.id : null;
    }
    findNextNode(definition, currentNodeId, nodeOutput) {
        const edges = definition.edges.filter(e => e.source === currentNodeId);
        if (edges.length === 0) {
            return null;
        }
        if (edges.length === 1) {
            return edges[0].target;
        }
        for (const edge of edges) {
            if (!edge.condition) {
                return edge.target;
            }
            try {
                const conditionResult = this.evaluateCondition(edge.condition, nodeOutput);
                if (conditionResult) {
                    return edge.target;
                }
            }
            catch {
            }
        }
        return null;
    }
    evaluateCondition(condition, nodeOutput) {
        try {
            const func = new Function('output', 'return ' + condition);
            return !!func(nodeOutput);
        }
        catch {
            return false;
        }
    }
    generateRunId() {
        return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractWorkflowId(definition) {
        return definition.metadata?.version || 'workflow';
    }
    getNodeTypeFromExecutor(executor) {
        const className = executor.constructor.name;
        if (className.includes('Start'))
            return 'start';
        if (className.includes('LLM'))
            return 'llm';
        if (className.includes('HTTP'))
            return 'http';
        if (className.includes('Condition'))
            return 'condition';
        if (className.includes('End'))
            return 'end';
        if (className.includes('Tool'))
            return 'tool';
        return 'unknown';
    }
}
exports.WorkflowExecutor = WorkflowExecutor;
function createWorkflowExecutor(config) {
    return new WorkflowExecutor(config);
}
//# sourceMappingURL=workflow-executor.js.map