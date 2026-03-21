/**
 * RAG Configuration Constants and Types
 * 
 * This file provides shared configuration for RAG functionality
 * across the frontend application.
 */

// Local type definitions (duplicated from @ai-engine/shared for frontend use)
export interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
  maxResults: number;
  separators: string[];
}

export interface FileTypeRAGConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

const FILE_SIZE_LIMITS = {
  singleFile: 10 * 1024 * 1024,      // 10MB
  singleKB: 500 * 1024 * 1024,       // 500MB
  maxKB: 1024 * 1024 * 1024,         // 1GB
  maxFilesPerKB: 100,                // 100 files
};

/**
 * Default RAG configuration
 */
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  chunkSize: 500,
  chunkOverlap: 50,
  similarityThreshold: 0.3,
  maxResults: 10,
  separators: ['\n\n', '\n', '.', '!', '?', ' '],
};

/**
 * File type specific RAG configurations
 */
export const FILE_TYPE_CONFIG: Record<string, FileTypeRAGConfig> = {
  pdf: { 
    chunkSize: 800, 
    separators: ['\n\n', '\n', '.'] 
  },
  docx: { 
    chunkSize: 600, 
    separators: ['\n\n', '\n'] 
  },
  txt: { 
    chunkSize: 500, 
    separators: ['\n\n', '\n', '.', '!', '?'] 
  },
  json: { 
    chunkSize: 500, 
    separators: ['\n', ','] 
  },
  csv: { 
    chunkSize: 500, 
    separators: ['\n'] 
  },
};

/**
 * File size limits (from shared types)
 */
export const FILE_LIMITS = {
  singleFile: FILE_SIZE_LIMITS.singleFile,           // 10MB
  singleKB: FILE_SIZE_LIMITS.singleKB,               // 500MB
  maxKB: FILE_SIZE_LIMITS.maxKB,                     // 1GB
  maxFilesPerKB: FILE_SIZE_LIMITS.maxFilesPerKB,     // 100 files
};

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate file for upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

export function validateFile(file: File): FileValidationResult {
  // Check file type
  const fileName = file.name.toLowerCase();
  const allowedTypes = ['.txt', '.json', '.csv', '.pdf', '.docx'];
  const fileExt = fileName.slice(fileName.lastIndexOf('.'));
  
  if (!allowedTypes.includes(fileExt)) {
    return {
      valid: false,
      error: `不支持的文件类型：${fileExt}。支持的类型：${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > FILE_LIMITS.singleFile) {
    return {
      valid: false,
      error: `文件大小超出限制 (${formatBytes(FILE_LIMITS.singleFile)})`,
      fileType: fileExt.slice(1),
      fileSize: file.size,
    };
  }

  return {
    valid: true,
    fileType: fileExt.slice(1),
    fileSize: file.size,
  };
}

/**
 * RAG Node configuration for workflow editor
 */
export interface RAGNodeEditorConfig {
  name: string;
  knowledgeBaseId: string;
  query: string;
  topK: number;
  similarityThreshold: number;
  outputFormat: 'raw' | 'combined';
}

export const DEFAULT_RAG_NODE_CONFIG: RAGNodeEditorConfig = {
  name: 'RAG 搜索',
  knowledgeBaseId: '',
  query: '{{ nodes.start.outputs.query }}',
  topK: 5,
  similarityThreshold: 0.3,
  outputFormat: 'combined',
};

/**
 * Knowledge base quota display helper
 */
export interface QuotaDisplay {
  used: string;
  limit: string;
  percentage: number;
  canUpload: boolean;
  remaining: string;
}

export function calculateQuotaDisplay(
  usedBytes: number,
  limitBytes: number = FILE_LIMITS.singleKB,
): QuotaDisplay {
  const percentage = Math.min((usedBytes / limitBytes) * 100, 100);
  const remaining = limitBytes - usedBytes;
  
  return {
    used: formatBytes(usedBytes),
    limit: formatBytes(limitBytes),
    percentage: Math.round(percentage * 10) / 10,
    canUpload: remaining > 0,
    remaining: formatBytes(remaining),
  };
}
