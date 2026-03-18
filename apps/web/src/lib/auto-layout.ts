import type { WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows'

export interface LayoutOptions {
  direction?: 'horizontal' | 'vertical'
  nodeWidth?: number
  nodeHeight?: number
  spacingX?: number
  spacingY?: number
  padding?: number
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: 'horizontal',
  nodeWidth: 200,
  nodeHeight: 100,
  spacingX: 300,
  spacingY: 150,
  padding: 50,
}

/**
 * Auto-layout algorithm for workflow nodes
 * Uses a simple layer-based approach
 */
export function autoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: LayoutOptions = {}
): WorkflowNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  if (nodes.length === 0) return []

  // Build adjacency list and in-degree count
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  nodes.forEach(node => {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  edges.forEach(edge => {
    const sources = adjacency.get(edge.source) || []
    sources.push(edge.target)
    adjacency.set(edge.source, sources)
    
    const current = inDegree.get(edge.target) || 0
    inDegree.set(edge.target, current + 1)
  })

  // Topological sort to determine layers
  const layers: string[][] = []
  const queue: string[] = []
  
  // Find all nodes with no incoming edges (start nodes)
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })

  let layerIndex = 0
  while (queue.length > 0) {
    const layerSize = queue.length
    const currentLayer: string[] = []
    
    for (let i = 0; i < layerSize; i++) {
      const nodeId = queue.shift()!
      currentLayer.push(nodeId)
      
      const neighbors = adjacency.get(nodeId) || []
      neighbors.forEach(neighborId => {
        const degree = inDegree.get(neighborId)! - 1
        inDegree.set(neighborId, degree)
        
        if (degree === 0) {
          queue.push(neighborId)
        }
      })
    }
    
    layers.push(currentLayer)
    layerIndex++
  }

  // Handle disconnected nodes (not reachable from start)
  const positionedNodes = new Set(layers.flat())
  const disconnectedNodes = nodes.filter(n => !positionedNodes.has(n.id))
  
  if (disconnectedNodes.length > 0) {
    layers.push(disconnectedNodes.map(n => n.id))
  }

  // Calculate positions
  const positionedNodesMap = new Map<string, WorkflowNode>()
  
  layers.forEach((layer, layerIdx) => {
    const isHorizontal = opts.direction === 'horizontal'
    
    layer.forEach((nodeId, nodeIdx) => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return

      const x = isHorizontal
        ? opts.padding + layerIdx * opts.spacingX
        : opts.padding + nodeIdx * opts.spacingX
      
      const y = isHorizontal
        ? opts.padding + nodeIdx * opts.spacingY
        : opts.padding + layerIdx * opts.spacingY

      positionedNodesMap.set(nodeId, {
        ...node,
        position: { x, y },
      })
    })
  })

  // Return nodes with updated positions
  return nodes.map(node => 
    positionedNodesMap.get(node.id) || node
  )
}

/**
 * Calculate the bounding box of all nodes
 */
export function getBoundingBox(nodes: WorkflowNode[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const positions = nodes.map(n => n.position || { x: 0, y: 0 })
  
  const minX = Math.min(...positions.map(p => p.x))
  const minY = Math.min(...positions.map(p => p.y))
  const maxX = Math.max(...positions.map(p => p.x))
  const maxY = Math.max(...positions.map(p => p.y))

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Center nodes in the viewport
 */
export function centerNodes(
  nodes: WorkflowNode[],
  viewportWidth: number = 1200,
  viewportHeight: number = 800
): WorkflowNode[] {
  const bbox = getBoundingBox(nodes)
  
  if (bbox.width === 0 && bbox.height === 0) return nodes

  const offsetX = (viewportWidth - bbox.width) / 2 - bbox.minX
  const offsetY = (viewportHeight - bbox.height) / 2 - bbox.minY

  return nodes.map(node => ({
    ...node,
    position: {
      x: (node.position?.x || 0) + offsetX,
      y: (node.position?.y || 0) + offsetY,
    },
  }))
}
