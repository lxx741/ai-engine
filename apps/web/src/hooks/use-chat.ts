import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useCallback } from 'react';
import { createSSESource, type SSECallbacks, type StreamChunkDto } from '@/lib/sse-client';
import { toast } from 'sonner';

export interface Conversation {
  id: string;
  appId: string;
  metadata?: {
    title?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  metadata?: any;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  userId?: string;
}

export function useConversations(appId?: string) {
  return useQuery({
    queryKey: ['conversations', appId],
    queryFn: async () => {
      const { data } = await api.get<Conversation[]>('/chat/sessions');
      if (appId) {
        return data.filter((conv) => conv.appId === appId);
      }
      return data;
    },
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await api.get<Conversation>(`/chat/sessions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(`/chat/sessions/${conversationId}/messages`);
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { appId: string; metadata?: Record<string, any> }) => {
      const { data: response } = await api.post<Conversation>('/chat/sessions', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/chat/sessions/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.removeQueries({ queryKey: ['conversation', id] });
      queryClient.removeQueries({ queryKey: ['messages', id] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const { data: response } = await api.post<ChatMessage>('/chat/completions', data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStreamMessage() {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [connection, setConnection] = useState<ReturnType<typeof createSSESource> | null>(null);

  const sendMessage = useCallback(
    (
      data: SendMessageRequest,
      callbacks?: {
        onChunk?: (chunk: StreamChunkDto) => void;
        onDone?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      setIsStreaming(true);

      const apiKey = localStorage.getItem('api_key');
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

      const sseCallbacks: SSECallbacks = {
        onChunk: (chunk) => {
          callbacks?.onChunk?.(chunk);
        },
        onDone: () => {
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          callbacks?.onDone?.();
        },
        onError: (error) => {
          setIsStreaming(false);
          toast.error('连接失败：' + error.message);
          callbacks?.onError?.(error);
        },
      };

      const conn = createSSESource(`${apiUrl}/chat/completions/stream`, data, sseCallbacks, {
        maxRetries: 3,
        retryDelay: 1000,
      });

      setConnection(conn);
      return conn;
    },
    [queryClient]
  );

  const stopStreaming = useCallback(() => {
    if (connection) {
      connection.close();
      setConnection(null);
      setIsStreaming(false);
    }
  }, [connection]);

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
  };
}

export function useChat(appId: string) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const { data: conversations, isLoading: isLoadingConversations } = useConversations(appId);
  const { data: currentConversation } = useConversation(activeConversation?.id || '');
  const { data: messages, isLoading: isLoadingMessages } = useConversationMessages(
    activeConversation?.id || ''
  );
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const { sendMessage: sendStreamMessage, stopStreaming, isStreaming } = useStreamMessage();

  const createNewConversation = useCallback(async () => {
    const result = await createConversation.mutateAsync({ appId });
    setActiveConversation(result);
    return result;
  }, [createConversation, appId]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
  }, []);

  return {
    conversations: conversations || [],
    activeConversation,
    currentConversation,
    messages: messages || [],
    isLoading: isLoadingConversations || isLoadingMessages,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    sendStreamMessage,
    stopStreaming,
    isStreaming,
  };
}
