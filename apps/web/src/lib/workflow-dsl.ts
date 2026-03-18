import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows'
import type { Node, Edge } from '@xyflow/react'

/**
 * Convert React Flow nodes/edges to backend DSL
 */
export function toBackendDSL(
  flowNodes: Node[],
  flowEdges: Edge[]
): WorkflowDefinition {
  return {
    nodes: flowNodes.map(node => ({
      id: node.id,
      type: node.type as WorkflowNode['type'],
      config: (node.data as any)?.config || {},
      position: node.position || { x: 0, y: 0 },
    })),
    edges: flowEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      condition: (edge.data as any)?.condition,
    })),
  }
}

/**
 * Convert backend DSL to React Flow nodes/edges
 */
export function fromBackendDSL(
  definition: WorkflowDefinition
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: (definition.nodes || []).map(node => ({
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      data: {
        name: node.config?.name || node.type,
        description: node.config?.description,
        config: node.config || {},
      },
    })),
    edges: (definition.edges || []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        condition: edge.condition,
      },
    })),
  }
}

/**
 * Export workflow to JSON file
 */
export function exportWorkflow(
  name: string,
  description: string | undefined,
  nodes: Node[],
  edges: Edge[]
): void {
  const workflow = {
    name,
    description,
    version: '1.0',
    createdAt: new Date().toISOString(),
    definition: toBackendDSL(nodes, edges),
  }

  const blob = new Blob([JSON.stringify(workflow, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import workflow from JSON file
 */
export function importWorkflow(
  file: File
): Promise<{
  name: string
  description?: string
  nodes: Node[]
  edges: Edge[]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        
        if (!data.definition || !data.definition.nodes) {
          throw new Error('Invalid workflow format')
        }

        const { nodes, edges } = fromBackendDSL(data.definition)
        
        resolve({
          name: data.name || 'Imported Workflow',
          description: data.description,
          nodes,
          edges,
        })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Validate workflow DSL structure
 */
export function validateDSL(definition: WorkflowDefinition): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!definition.nodes || !Array.isArray(definition.nodes)) {
    errors.push('Missing or invalid nodes array')
  }

  if (!definition.edges || !Array.isArray(definition.edges)) {
    errors.push('Missing or invalid edges array')
  }

  // Check for duplicate node IDs
  if (definition.nodes) {
    const nodeIds = new Set<string>()
    definition.nodes.forEach(node => {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`)
      }
      nodeIds.add(node.id)
    })
  }

  // Check node types
  const validTypes = ['start', 'llm', 'http', 'condition', 'end', 'tool']
  if (definition.nodes) {
    definition.nodes.forEach(node => {
      if (!validTypes.includes(node.type)) {
        errors.push(`Invalid node type: ${node.type}`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create empty workflow definition
 */
export function createEmptyDefinition(): WorkflowDefinition {
  return {
    nodes: [],
    edges: [],
    variables: {},
  }
}

/**
 * Create workflow with start and end nodes
 */
export function createBasicWorkflow(name: string): WorkflowDefinition {
  const startId = `start_${Date.now()}`
  const endId = `end_${Date.now()}`

  return {
    nodes: [
      {
        id: startId,
        type: 'start',
        config: {
          name: '开始',
          outputs: [{ name: 'input', type: 'string' }],
        },
        position: { x: 100, y: 300 },
      },
      {
        id: endId,
        type: 'end',
        config: {
          name: '结束',
          outputs: [{ name: 'result', value: '{{ nodes.start.output }}' }],
        },
        position: { x: 500, y: 300 },
      },
    ],
    edges: [
      {
        id: `edge_${Date.now()}`,
        source: startId,
        target: endId,
      },
    ],
    variables: {},
  }
}
