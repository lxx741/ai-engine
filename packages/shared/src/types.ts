// Common types shared across server and web

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export type ProviderType = 'aliyun' | 'ollama' | 'openai' | 'anthropic'

export interface ModelConfig {
  provider: ProviderType
  model: string
  apiKey?: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
  [key: string]: any
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  [key: string]: any
}

export interface ChatCompletionChunk {
  content: string
  finishReason?: string | null
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ============================================
// Workflow Engine Types
// ============================================

/**
 * Workflow node type
 */
export type WorkflowNodeType =
  | 'start'
  | 'llm'
  | 'http'
  | 'condition'
  | 'end'

/**
 * Workflow node configuration
 */
export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  name: string
  description?: string
  config: NodeConfig
  position?: {
    x: number
    y: number
  }
}

/**
 * Node configuration by type
 */
export interface NodeConfig {
  // Common config
  timeout?: number
  retries?: number

  // LLM node config
  modelId?: string
  prompt?: string
  temperature?: number
  maxTokens?: number

  // HTTP node config
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string

  // Condition node config
  expression?: string

  // Start/End node config
  variables?: Record<string, any>
  [key: string]: any
}

/**
 * Workflow edge (connection between nodes)
 */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
  label?: string
}

/**
 * Workflow definition (DAG)
 */
export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, any>
  metadata?: {
    version?: string
    author?: string
    description?: string
  }
}

/**
 * Workflow execution status
 */
export type WorkflowStatus =
  | 'draft'
  | 'published'
  | 'archived'

/**
 * Workflow run status
 */
export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string
  runId: string
  variables: Record<string, any>
  nodeOutputs: Record<string, any>
  currentNodeId?: string
  startTime: Date
  endTime?: Date
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string
  success: boolean
  output?: any
  error?: string
  duration?: number
  timestamp: Date
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  runId: string
  workflowId: string
  status: WorkflowRunStatus
  output?: any
  error?: string
  nodeResults: NodeExecutionResult[]
  duration: number
  startTime: Date
  endTime: Date
}

// ============================================
// RAG (Retrieval-Augmented Generation) Types
// ============================================

/**
 * RAG configuration
 */
export interface RAGConfig {
  /** Number of tokens per chunk (default: 500) */
  chunkSize: number
  /** Number of overlapping tokens between chunks (default: 50) */
  chunkOverlap: number
  /** Similarity threshold for filtering results (0-1, default: 0.3) */
  similarityThreshold: number
  /** Maximum number of results to return (default: 10) */
  maxResults: number
  /** Separators for chunking (priority order) */
  separators: string[]
}

/**
 * Default RAG configuration
 */
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  chunkSize: 500,
  chunkOverlap: 50,
  similarityThreshold: 0.3,
  maxResults: 10,
  separators: ['\n\n', '\n', '.', '!', '?', ' '],
}

/**
 * File type specific RAG configuration
 */
export interface FileTypeRAGConfig {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

/**
 * File type configurations
 */
export const FILE_TYPE_RAG_CONFIG: Record<string, FileTypeRAGConfig> = {
  pdf: { chunkSize: 800, separators: ['\n\n', '\n', '.'] },
  docx: { chunkSize: 600, separators: ['\n\n', '\n'] },
  txt: { chunkSize: 500, separators: ['\n\n', '\n', '.', '!', '?'] },
  json: { chunkSize: 500, separators: ['\n', ','] },
  csv: { chunkSize: 500, separators: ['\n'] },
}

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  singleFile: 10 * 1024 * 1024, // 10MB
  singleKB: 500 * 1024 * 1024, // 500MB
  maxKB: 1024 * 1024 * 1024, // 1GB (expandable)
  maxFilesPerKB: 100, // Maximum 100 files per knowledge base
}

/**
 * Knowledge base quota information
 */
export interface KnowledgeBaseQuota {
  /** Used storage in bytes */
  used: number
  /** Storage limit in bytes */
  limit: number
  /** Number of files */
  fileCount: number
  /** Check if a new file of given size can be uploaded */
  canUpload: (size: number) => boolean
}

/**
 * Document chunk for RAG
 */
export interface DocumentChunk {
  /** Unique identifier */
  id: string
  /** Chunk content */
  content: string
  /** Vector embedding */
  embedding: number[]
  /** Metadata */
  metadata: {
    /** Source document name */
    source: string
    /** Page index (for PDF/DOCX) */
    pageIndex?: number
    /** Chunk index within document */
    chunkIndex: number
  }
}

/**
 * RAG search result
 */
export interface RAGSearchResult {
  /** The matched chunk */
  chunk: DocumentChunk
  /** Similarity score (0-1) */
  score: number
  /** Source document information */
  document: {
    id: string
    name: string
    fileType: string
  }
}

/**
 * Knowledge base document
 */
export interface KnowledgeDocument {
  id: string
  knowledgeBaseId: string
  name: string
  originalName: string
  fileType: 'pdf' | 'docx' | 'txt' | 'json' | 'csv'
  fileSize: number
  filePath: string
  content: string
  chunkCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Knowledge base
 */
export interface KnowledgeBase {
  id: string
  appId: string
  name: string
  description?: string
  config: RAGConfig
  quota: KnowledgeBaseQuota
  documentCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * RAG node configuration for workflow
 */
export interface RAGNodeConfig {
  name: string
  knowledgeBaseId: string
  query: string // Supports variable references: {{ nodes.start.outputs.query }}
  topK: number
  similarityThreshold?: number
  outputFormat: 'raw' | 'combined'
}

/**
 * Upload document options
 */
export interface UploadDocumentOptions {
  knowledgeBaseId: string
  name?: string
  description?: string
  chunkConfig?: Partial<RAGConfig>
}

/**
 * OCR options for document processing
 */
export interface OCROptions {
  enabled: boolean
  language?: 'eng' | 'chi_sim' | 'chi_tra' | 'jpn' | 'kor'
  preprocess?: boolean
}
