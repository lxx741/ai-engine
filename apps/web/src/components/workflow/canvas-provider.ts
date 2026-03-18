import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowDefinition } from '@/hooks/use-workflows'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

interface CanvasState {
  // State
  nodes: Node[]
  edges: Edge[]
  selectedNode?: string
  selectedEdge?: string
  viewport: Viewport

  // Metadata
  workflowName?: string
  workflowDescription?: string

  // Actions - Nodes
  addNode: (node: Node) => void
  updateNode: (id: string, updates: Partial<Node>) => void
  deleteNode: (id: string) => void
  updateNodeConfig: (id: string, config: Record<string, any>) => void

  // Actions - Edges
  addEdge: (edge: Edge) => void
  deleteEdge: (id: string) => void
  updateEdge: (id: string, updates: Partial<Edge>) => void

  // Actions - Selection
  setSelectedNode: (id: string | undefined) => void
  setSelectedEdge: (id: string | undefined) => void
  clearSelection: () => void

  // Actions - Viewport
  setViewport: (viewport: Viewport) => void

  // Actions - Metadata
  setWorkflowName: (name: string) => void
  setWorkflowDescription: (description: string) => void

  // Actions - Bulk
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setDefinition: (definition: WorkflowDefinition) => void

  // Actions - Persistence
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  clearCanvas: () => void
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

const STORAGE_KEY = 'workflow-canvas-state'

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNode: undefined,
      selectedEdge: undefined,
      viewport: DEFAULT_VIEWPORT,
      workflowName: undefined,
      workflowDescription: undefined,

      // Node actions
      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
        })),

      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),

      deleteNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNode: state.selectedNode === id ? undefined : state.selectedNode,
        })),

      updateNodeConfig: (id, config) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, config: { ...(n.data as any)?.config, ...config } } } : n
          ),
        })),

      // Edge actions
      addEdge: (edge) =>
        set((state) => ({
          edges: [...state.edges, edge],
        })),

      deleteEdge: (id) =>
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
          selectedEdge: state.selectedEdge === id ? undefined : state.selectedEdge,
        })),

      updateEdge: (id, updates) =>
        set((state) => ({
          edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      // Selection actions
      setSelectedNode: (id) =>
        set({
          selectedNode: id,
          selectedEdge: undefined,
        }),

      setSelectedEdge: (id) =>
        set({
          selectedEdge: id,
          selectedNode: undefined,
        }),

      clearSelection: () =>
        set({
          selectedNode: undefined,
          selectedEdge: undefined,
        }),

      // Viewport actions
      setViewport: (viewport) => set({ viewport }),

      // Metadata actions
      setWorkflowName: (name) => set({ workflowName: name }),
      setWorkflowDescription: (description) => set({ workflowDescription: description }),

      // Bulk actions
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setDefinition: (definition) => {
        // Convert backend DSL to React Flow format
        const convertedNodes: Node[] = (definition.nodes || []).map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: {
            name: node.config?.name || node.type,
            description: node.config?.description,
            config: node.config || {},
          },
        }))
        const convertedEdges: Edge[] = (definition.edges || []).map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: {
            condition: edge.condition,
          },
        }))
        set({
          nodes: convertedNodes,
          edges: convertedEdges,
        })
      },

      // Persistence actions
      saveToLocalStorage: () => {
        const { nodes, edges, workflowName, workflowDescription } = get()
        const data = { nodes, edges, workflowName, workflowDescription }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        console.log('✅ Canvas auto-saved')
      },

      loadFromLocalStorage: () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const data = JSON.parse(saved)
            set({
              nodes: data.nodes || [],
              edges: data.edges || [],
              workflowName: data.workflowName,
              workflowDescription: data.workflowDescription,
            })
            console.log('✅ Canvas loaded from local storage')
          }
        } catch (error) {
          console.error('Failed to load canvas from local storage:', error)
        }
      },

      clearCanvas: () =>
        set({
          nodes: [],
          edges: [],
          selectedNode: undefined,
          selectedEdge: undefined,
          viewport: DEFAULT_VIEWPORT,
          workflowName: undefined,
          workflowDescription: undefined,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        workflowName: state.workflowName,
        workflowDescription: state.workflowDescription,
      }),
    }
  )
)

// Helper hook for auto-save
import { useEffect } from 'react'
import debounce from 'lodash/debounce'

export function useAutoSave() {
  const { nodes, edges, saveToLocalStorage } = useCanvasStore()

  const debouncedSave = useEffect(
    debounce(() => {
      saveToLocalStorage()
    }, 1000),
    [nodes, edges, saveToLocalStorage]
  )
}
