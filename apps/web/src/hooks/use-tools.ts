'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Tool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  [key: string]: any;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

/**
 * 获取工具列表
 */
export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data } = await api.get<Tool[]>('/tools');
      return data;
    },
  });
}

/**
 * 获取工具详情
 */
export function useTool(name: string) {
  return useQuery({
    queryKey: ['tools', name],
    queryFn: async () => {
      const { data } = await api.get<Tool>(`/tools/${name}`);
      return data;
    },
    enabled: !!name,
  });
}

/**
 * 执行工具
 */
export function useExecuteTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, params }: { name: string; params: Record<string, any> }) => {
      const { data } = await api.post<ToolExecutionResult>(`/tools/${name}/execute`, { params });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}
