export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
    statusCode?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type ProviderType = 'aliyun' | 'ollama' | 'openai' | 'anthropic';
export interface ModelConfig {
    provider: ProviderType;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    [key: string]: any;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}
export interface ChatCompletionRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    [key: string]: any;
}
export interface ChatCompletionChunk {
    content: string;
    finishReason?: string | null;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export type WorkflowNodeType = 'start' | 'llm' | 'http' | 'condition' | 'end';
export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    name: string;
    description?: string;
    config: NodeConfig;
    position?: {
        x: number;
        y: number;
    };
}
export interface NodeConfig {
    timeout?: number;
    retries?: number;
    modelId?: string;
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    expression?: string;
    variables?: Record<string, any>;
    [key: string]: any;
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
    label?: string;
}
export interface WorkflowDefinition {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: Record<string, any>;
    metadata?: {
        version?: string;
        author?: string;
        description?: string;
    };
}
export type WorkflowStatus = 'draft' | 'published' | 'archived';
export type WorkflowRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export interface WorkflowExecutionContext {
    workflowId: string;
    runId: string;
    variables: Record<string, any>;
    nodeOutputs: Record<string, any>;
    currentNodeId?: string;
    startTime: Date;
    endTime?: Date;
}
export interface NodeExecutionResult {
    nodeId: string;
    success: boolean;
    output?: any;
    error?: string;
    duration?: number;
    timestamp: Date;
}
export interface WorkflowExecutionResult {
    runId: string;
    workflowId: string;
    status: WorkflowRunStatus;
    output?: any;
    error?: string;
    nodeResults: NodeExecutionResult[];
    duration: number;
    startTime: Date;
    endTime: Date;
}
