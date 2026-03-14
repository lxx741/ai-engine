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
export interface WorkflowNodeConfig {
    id: string;
    type: string;
    name: string;
    config: Record<string, any>;
}
export interface WorkflowEdgeConfig {
    id: string;
    source: string;
    target: string;
    condition?: string;
}
export interface WorkflowDefinition {
    nodes: WorkflowNodeConfig[];
    edges: WorkflowEdgeConfig[];
    variables?: Record<string, any>;
}
export declare enum WorkflowStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export declare enum RunStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
