import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowDefinition } from '@/hooks/use-workflows';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasState {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNode?: string;
  selectedEdge?: string;
  viewport: Viewport;

  // Metadata
  workflowName?: string;
  workflowDescription?: string;

  // Actions - Nodes
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  updateNodeConfig: (id: string, config: Record<string, any>) => void;

  // Actions - Edges
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<Edge>) => void;

  // Actions - Selection
  setSelectedNode: (id: string | undefined) => void;
  setSelectedEdge: (id: string | undefined) => void;
  clearSelection: () => void;

  // Actions - Viewport
  setViewport: (viewport: Viewport) => void;

  // Actions - Metadata
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;

  // Actions - Bulk
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setDefinition: (definition: WorkflowDefinition) => void;
  applyTemplate: (nodes: Node[], edges: Edge[], name: string, description?: string) => void;

  // Actions - Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  clearCanvas: () => void;

  // Actions - History (Undo/Redo)
  pushToHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions - Auto Layout
  autoLayout: (direction?: 'horizontal' | 'vertical') => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

const STORAGE_KEY = 'workflow-canvas-state';

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
            n.id === id
              ? { ...n, data: { ...n.data, config: { ...(n.data as any)?.config, ...config } } }
              : n
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
        }));
        const convertedEdges: Edge[] = (definition.edges || []).map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: {
            condition: edge.condition,
          },
        }));
        set({
          nodes: convertedNodes,
          edges: convertedEdges,
        });
      },
      applyTemplate: (nodes, edges, name, description) => {
        set({
          nodes,
          edges,
          workflowName: name,
          workflowDescription: description,
        });
      },

      // Persistence actions
      saveToLocalStorage: () => {
        const { nodes, edges, workflowName, workflowDescription } = get();
        const data = { nodes, edges, workflowName, workflowDescription };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('✅ Canvas auto-saved');
      },

      loadFromLocalStorage: () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const data = JSON.parse(saved);
            set({
              nodes: data.nodes || [],
              edges: data.edges || [],
              workflowName: data.workflowName,
              workflowDescription: data.workflowDescription,
            });
            console.log('✅ Canvas loaded from local storage');
          }
        } catch (error) {
          console.error('Failed to load canvas from local storage:', error);
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

      // History actions (Undo/Redo)
      pushToHistory: () => {
        const { nodes, edges } = get();
        try {
          const saved = localStorage.getItem('workflow-canvas-history');
          const history = saved ? JSON.parse(saved) : { past: [], future: [] };

          const newPast = [...history.past, { nodes: [...nodes], edges: [...edges] }];
          if (newPast.length > 50) {
            newPast.shift();
          }

          localStorage.setItem(
            'workflow-canvas-history',
            JSON.stringify({
              past: newPast,
              future: [],
            })
          );
        } catch (error) {
          console.error('Failed to push to history:', error);
        }
      },

      undo: () => {
        try {
          const saved = localStorage.getItem('workflow-canvas-history');
          if (!saved) return false;

          const history = JSON.parse(saved);
          if (history.past.length === 0) return false;

          const { nodes, edges } = get();
          const previous = history.past[history.past.length - 1];
          const newPast = history.past.slice(0, -1);
          const newFuture = [...history.future, { nodes: [...nodes], edges: [...edges] }];

          set({ nodes: previous.nodes, edges: previous.edges });

          localStorage.setItem(
            'workflow-canvas-history',
            JSON.stringify({
              past: newPast,
              future: newFuture,
            })
          );

          return true;
        } catch (error) {
          console.error('Failed to undo:', error);
          return false;
        }
      },

      redo: () => {
        try {
          const saved = localStorage.getItem('workflow-canvas-history');
          if (!saved) return false;

          const history = JSON.parse(saved);
          if (history.future.length === 0) return false;

          const { nodes, edges } = get();
          const next = history.future[history.future.length - 1];
          const newFuture = history.future.slice(0, -1);
          const newPast = [...history.past, { nodes: [...nodes], edges: [...edges] }];

          set({ nodes: next.nodes, edges: next.edges });

          localStorage.setItem(
            'workflow-canvas-history',
            JSON.stringify({
              past: newPast,
              future: newFuture,
            })
          );

          return true;
        } catch (error) {
          console.error('Failed to redo:', error);
          return false;
        }
      },

      canUndo: () => {
        try {
          const saved = localStorage.getItem('workflow-canvas-history');
          if (!saved) return false;
          const history = JSON.parse(saved);
          return history.past.length > 0;
        } catch (error) {
          return false;
        }
      },

      canRedo: () => {
        try {
          const saved = localStorage.getItem('workflow-canvas-history');
          if (!saved) return false;
          const history = JSON.parse(saved);
          return history.future.length > 0;
        } catch (error) {
          return false;
        }
      },

      // Auto Layout action
      autoLayout: (direction = 'horizontal') => {
        const { nodes, edges, setNodes, setEdges } = get();
        // Dynamic import to avoid circular dependency
        import('@/lib/auto-layout').then(({ autoLayout, centerNodes }) => {
          const workflowNodes = nodes.map((n) => ({
            id: n.id,
            type: n.type as any,
            config: (n.data as any)?.config || {},
            position: n.position,
          }));
          const workflowEdges = edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            condition: (e.data as any)?.condition,
          }));

          const layoutedNodes = autoLayout(workflowNodes, workflowEdges, {
            direction,
            spacingX: 300,
            spacingY: 150,
          });
          const centeredNodes = centerNodes(layoutedNodes, 1200, 800);

          const rfNodes: Node[] = centeredNodes.map((n) => ({
            ...n,
            position: n.position || { x: 0, y: 0 },
            data: {
              name: n.config?.name || n.type,
              description: n.config?.description,
              config: n.config || {},
            },
          }));

          setNodes(rfNodes);
        });
      },
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
);

// Helper hook for auto-save
import { useEffect } from 'react';
import debounce from 'lodash/debounce';

export function useAutoSave() {
  const { nodes, edges, saveToLocalStorage } = useCanvasStore();

  useEffect(() => {
    const debouncedSave = debounce(() => {
      saveToLocalStorage();
    }, 1000);

    debouncedSave();

    return () => {
      debouncedSave.cancel();
    };
  }, [nodes, edges, saveToLocalStorage]);
}
