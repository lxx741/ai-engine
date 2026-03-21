import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Document {
  id: string;
  knowledgeBaseId: string;
  name: string;
  originalName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'json' | 'csv';
  fileSize: number;
  chunkCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentInput {
  file: File;
  name?: string;
  description?: string;
}

/**
 * Hook to get all documents in a knowledge base
 */
export function useDocuments(knowledgeBaseId?: string) {
  return useQuery({
    queryKey: ['documents', knowledgeBaseId],
    queryFn: async () => {
      if (!knowledgeBaseId) return [];
      const { data } = await api.get<Document[]>(
        `/knowledge-bases/${knowledgeBaseId}/documents`,
      );
      return data;
    },
    enabled: !!knowledgeBaseId,
    refetchInterval: 5000, // Refetch every 5 seconds to check processing status
  });
}

/**
 * Hook to upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      knowledgeBaseId,
      file,
      name,
    }: {
      knowledgeBaseId: string;
      file: File;
      name?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (name) {
        formData.append('name', name);
      }

      const { data } = await api.post<Document>(
        `/knowledge-bases/${knowledgeBaseId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return data;
    },
    onSuccess: (_, { knowledgeBaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-stats'] });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      knowledgeBaseId,
      documentId,
    }: {
      knowledgeBaseId: string;
      documentId: string;
    }) => {
      await api.delete(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`);
      return documentId;
    },
    onSuccess: (_, { knowledgeBaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', knowledgeBaseId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-stats'] });
    },
  });
}

/**
 * Hook to search in knowledge base
 */
export function useKnowledgeBaseSearch() {
  return useMutation({
    mutationFn: async ({
      knowledgeBaseId,
      query,
      topK = 10,
      threshold = 0.3,
    }: {
      knowledgeBaseId: string;
      query: string;
      topK?: number;
      threshold?: number;
    }) => {
      const params = new URLSearchParams({
        query,
        topK: topK.toString(),
        threshold: threshold.toString(),
      });

      const { data } = await api.get<any[]>(
        `/knowledge-bases/${knowledgeBaseId}/search?${params}`,
      );
      return data;
    },
  });
}
