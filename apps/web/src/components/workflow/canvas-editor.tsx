'use client'

import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useCanvasStore } from './canvas-provider'
import { Sidebar } from './sidebar'
import { ConfigPanel } from './config-panel'
import { WorkflowToolbar } from './workflow-toolbar'
import {
  StartNode,
  LLMNode,
  HTTPNode,
  ConditionNode,
  EndNode,
  ToolNode,
} from './nodes'

// Register custom node types
const nodeTypes = {
  start: StartNode,
  llm: LLMNode,
  http: HTTPNode,
  condition: ConditionNode,
  end: EndNode,
  tool: ToolNode,
}

interface CanvasEditorProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export function CanvasEditor({ 
  initialNodes = [], 
  initialEdges = [],
  onSubmit,
  onCancel,
}: CanvasEditorProps) {
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    addEdge: addEdgeToStore,
    selectedNode,
    selectedEdge,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
  } = useCanvasStore()

  // Initialize from props if provided
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
    }
    if (initialEdges.length > 0) {
      setEdges(initialEdges)
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Handle node changes (position updates, etc.)
  const onNodesChange = useCallback(
    (changes: any[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateNode(change.id, { position: change.position })
        }
      })
    },
    [updateNode]
  )

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: any[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteEdge(change.id)
        }
      })
    },
    [deleteEdge]
  )

  // Handle new edge creation
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge_${Date.now()}`,
        type: 'default',
      }
      addEdgeToStore(edge)
    },
    [addEdgeToStore]
  )

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode]
  )

  // Handle edge selection
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge.id)
    },
    [setSelectedEdge]
  )

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Handle node deletion (keyboard shortcut)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        if (selectedNode) {
          deleteNode(selectedNode)
        }
        if (selectedEdge) {
          deleteEdge(selectedEdge)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <WorkflowToolbar 
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Palette */}
        <Sidebar />
        
        {/* Canvas */}
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            minZoom={0.5}
            maxZoom={2}
            deleteKeyCode={[]} // We handle deletion manually
            className="bg-slate-50"
          >
            <Background color="#888" gap={15} />
            <Controls />
            <MiniMap 
              nodeStrokeColor={(n) => {
                const colors: Record<string, string> = {
                  start: '#10b981',
                  llm: '#3b82f6',
                  http: '#a855f7',
                  condition: '#f59e0b',
                  end: '#f43f5e',
                  tool: '#f97316',
                }
                return colors[n.type || 'default'] || '#64748b'
              }}
              nodeColor={(n) => {
                const colors: Record<string, string> = {
                  start: '#d1fae5',
                  llm: '#dbeafe',
                  http: '#f3e8ff',
                  condition: '#fef3c7',
                  end: '#ffe4e6',
                  tool: '#ffedd5',
                }
                return colors[n.type || 'default'] || '#f1f5f9'
              }}
              className="bg-white border rounded-lg shadow-lg"
            />
          </ReactFlow>
        </div>
        
        {/* Config Panel */}
        {selectedNode && (
          <ConfigPanel 
            nodeId={selectedNode}
            onClose={() => setSelectedNode(undefined)}
          />
        )}
      </div>
    </div>
  )
}

// Helper to check if focus is in an input field
function isInputFocused(): boolean {
  const activeElement = document.activeElement
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.tagName === 'SELECT'
  )
}
