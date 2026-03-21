import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface KnowledgeBase {
  id: string;
  appId: string;
  name: string;
  description?: string;
  config: {
    chunkSize: number;
    chunkOverlap: number;
    similarityThreshold: number;
    maxResults: number;
  };
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
  config?: Partial<KnowledgeBase['config']>;
}

export interface UpdateKnowledgeBaseInput {
  name?: string;
  description?: string;
  config?: Partial<KnowledgeBase['config']>;
}

/**
 * Hook to get all knowledge bases
 */
export function useAllKnowledgeBases() {
  return useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: async () => {
      const { data } = await api.get<KnowledgeBase[]>('/knowledge-bases');
      return data;
    },
  });
}

/**
 * Hook to get knowledge base by app ID
 */
export function useKnowledgeBase(appId?: string) {
  return useQuery({
    queryKey: ['knowledge-base', appId],
    queryFn: async () => {
      if (!appId) return null;
      const { data } = await api.get<KnowledgeBase>(`/knowledge-bases/by-app/${appId}`);
      return data;
    },
    enabled: !!appId,
  });
}

/**
 * Hook to create a knowledge base
 */
export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appId, data }: { appId: string; data: CreateKnowledgeBaseInput }) => {
      const { data: response } = await api.post<KnowledgeBase>(
        `/knowledge-bases?appId=${appId}`,
        data,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

/**
 * Hook to update a knowledge base
 */
export function useUpdateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateKnowledgeBaseInput }) => {
      const { data: response } = await api.patch<KnowledgeBase>(
        `/knowledge-bases/${id}`,
        data,
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', id] });
    },
  });
}

/**
 * Hook to delete a knowledge base
 */
export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge-bases/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

/**
 * Hook to get knowledge base statistics
 */
export function useKnowledgeBaseStats(id?: string) {
  return useQuery({
    queryKey: ['knowledge-base-stats', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<{
        documentCount: number;
        totalChunks: number;
        totalSize: number;
        sizeFormatted: string;
      }>(`/knowledge-bases/${id}/stats`);
      return data;
    },
    enabled: !!id,
  });
}
