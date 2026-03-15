import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface WorkflowNode {
  id: string
  type: 'start' | 'llm' | 'http' | 'condition' | 'end'
  config: Record<string, any>
  position?: {
    x: number
    y: number
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, any>
}

export interface Workflow {
  id: string
  appId: string
  name: string
  description?: string
  definition: WorkflowDefinition
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface WorkflowRun {
  id: string
  workflowId: string
  input: Record<string, any>
  output: Record<string, any>
  status: 'success' | 'failed' | 'running'
  error?: string
  createdAt: string
  duration?: number
}

export function useWorkflows(appId?: string, status?: string) {
  const queryParams = new URLSearchParams()
  if (appId) queryParams.append('appId', appId)
  if (status) queryParams.append('status', status)
  
  return useQuery({
    queryKey: ['workflows', appId, status],
    queryFn: async () => {
      const url = `/workflows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const { data } = await api.get<Workflow[]>(url)
      return data
    },
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: async () => {
      const { data } = await api.get<Workflow>(`/workflows/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Workflow>) => {
      const { data: response } = await api.post<Workflow>('/workflows', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workflow> }) => {
      const { data: response } = await api.patch<Workflow>(`/workflows/${id}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow'] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.removeQueries({ queryKey: ['workflows', id] })
    },
  })
}

export function useRunWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input?: Record<string, any> }) => {
      const { data } = await api.post(`/workflows/${id}/run`, { input })
      return data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflows', id, 'runs'] })
    },
  })
}

export function useWorkflowRuns(workflowId: string, limit?: number) {
  return useQuery({
    queryKey: ['workflows', workflowId, 'runs', limit],
    queryFn: async () => {
      const url = `/workflows/${workflowId}/runs${limit ? `?limit=${limit}` : ''}`
      const { data } = await api.get<WorkflowRun[]>(url)
      return data
    },
    enabled: !!workflowId,
  })
}

export function useWorkflowRun(runId: string) {
  return useQuery({
    queryKey: ['workflow-runs', runId],
    queryFn: async () => {
      const { data } = await api.get(`/workflows/runs/${runId}`)
      return data
    },
    enabled: !!runId,
  })
}
