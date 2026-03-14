import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface App {
  id: string
  name: string
  description?: string
  apiKey: string
  modelId?: string
  config: Record<string, any>
  createdAt: string
  updatedAt: string
}

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const { data } = await api.get<App[]>('/apps')
      return data
    },
  })
}

export function useApp(id: string) {
  return useQuery({
    queryKey: ['apps', id],
    queryFn: async () => {
      const { data } = await api.get<App>(`/apps/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateApp() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<App>) => {
      const { data: response } = await api.post<App>('/apps', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<App> }) => {
      const { data: response } = await api.put<App>(`/apps/${id}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/apps/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      queryClient.removeQueries({ queryKey: ['apps', id] })
    },
  })
}
