import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Model {
  id: string
  name: string
  provider: string
  model: string
  config: Record<string, any>
  enabled: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const { data } = await api.get<Model[]>('/models')
      return data
    },
  })
}
