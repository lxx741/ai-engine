export interface WorkflowNode {
  id: string
  type: 'start' | 'llm' | 'http' | 'condition' | 'end' | 'tool'
  config: Record<string, any>
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface NodeIO {
  inputs: string[]
  outputs: string[]
  hasMultipleOutputs?: boolean
}

const nodeIOConfig: Record<string, NodeIO> = {
  start: { 
    inputs: [], 
    outputs: ['output'],
    hasMultipleOutputs: false,
  },
  llm: { 
    inputs: ['prompt'], 
    outputs: ['response'],
    hasMultipleOutputs: false,
  },
  http: { 
    inputs: ['request'], 
    outputs: ['response'],
    hasMultipleOutputs: false,
  },
  condition: { 
    inputs: ['expression'], 
    outputs: ['true', 'false'],
    hasMultipleOutputs: true,
  },
  end: { 
    inputs: ['result'], 
    outputs: [],
    hasMultipleOutputs: false,
  },
  tool: { 
    inputs: ['params'], 
    outputs: ['result'],
    hasMultipleOutputs: false,
  },
}

/**
 * Validate workflow structure
 */
export function validateFlow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check 1: Must have at least one start node
  const startNodes = nodes.filter(n => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push('工作流必须包含至少一个开始节点')
  } else if (startNodes.length > 1) {
    warnings.push('工作流包含多个开始节点，这可能导致执行问题')
  }

  // Check 2: Must have at least one end node
  const endNodes = nodes.filter(n => n.type === 'end')
  if (endNodes.length === 0) {
    warnings.push('工作流没有结束节点，输出可能无法正确返回')
  }

  // Check 3: Validate node connections
  nodes.forEach(node => {
    const ioConfig = nodeIOConfig[node.type]
    if (!ioConfig) {
      errors.push(`未知节点类型：${node.type}`)
      return
    }

    // Check inputs
    const incomingEdges = edges.filter(e => e.target === node.id)
    
    if (ioConfig.inputs.length > 0 && incomingEdges.length === 0) {
      // Start nodes don't need inputs
      if (node.type !== 'start') {
        errors.push(
          `节点 "${node.config.name || node.id}" (${node.type}) 缺少输入连接`
        )
      }
    }

    // Check outputs for condition nodes
    if (node.type === 'condition') {
      const outgoingEdges = edges.filter(e => e.source === node.id)
      if (outgoingEdges.length < 2) {
        warnings.push(
          `条件节点 "${node.config.name || node.id}" 应该有 2 个输出分支（true/false）`
        )
      }
    }
  })

  // Check 4: Detect orphan nodes (except start and end)
  nodes.forEach(node => {
    if (node.type === 'start' || node.type === 'end') return

    const hasInput = edges.some(e => e.target === node.id)
    const hasOutput = edges.some(e => e.source === node.id)

    if (!hasInput && !hasOutput) {
      errors.push(
        `节点 "${node.config.name || node.id}" (${node.type}) 是孤立节点，没有连接到工作流`
      )
    } else if (!hasInput) {
      warnings.push(
        `节点 "${node.config.name || node.id}" (${node.type}) 没有输入连接`
      )
    } else if (!hasOutput) {
      warnings.push(
        `节点 "${node.config.name || node.id}" (${node.type}) 没有输出连接`
      )
    }
  })

  // Check 5: Detect cycles (DFS)
  const hasCycle = detectCycle(nodes, edges)
  if (hasCycle) {
    errors.push('工作流包含循环依赖，这会导致无限执行')
  }

  // Check 6: Validate edge connections
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (!sourceNode) {
      errors.push(`边的源节点不存在：${edge.source}`)
    } else if (!targetNode) {
      errors.push(`边的目标节点不存在：${edge.target}`)
    } else if (edge.source === edge.target) {
      errors.push(`节点不能连接到自身：${edge.source}`)
    }

    // Check condition on non-condition nodes
    if (edge.condition && sourceNode?.type !== 'condition') {
      warnings.push(
        `只有条件节点的连接可以设置条件表达式：${edge.id}`
      )
    }
  })

  // Check 7: Validate node config
  nodes.forEach(node => {
    const configErrors = validateNodeConfig(node)
    errors.push(...configErrors)
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate individual node configuration
 */
function validateNodeConfig(node: WorkflowNode): string[] {
  const errors: string[] = []

  switch (node.type) {
    case 'llm':
      if (!node.config.prompt || !node.config.prompt.trim()) {
        errors.push(`LLM 节点 "${node.config.name || node.id}" 必须配置提示词`)
      }
      break

    case 'http':
      if (!node.config.url || !node.config.url.trim()) {
        errors.push(`HTTP 节点 "${node.config.name || node.id}" 必须配置 URL`)
      }
      if (!node.config.method) {
        errors.push(`HTTP 节点 "${node.config.name || node.id}" 必须配置请求方法`)
      }
      break

    case 'condition':
      if (!node.config.expression || !node.config.expression.trim()) {
        errors.push(`条件节点 "${node.config.name || node.id}" 必须配置条件表达式`)
      }
      break

    case 'tool':
      if (!node.config.toolName || !node.config.toolName.trim()) {
        errors.push(`工具节点 "${node.config.name || node.id}" 必须选择工具`)
      }
      break
  }

  return errors
}

/**
 * Detect cycles in the workflow using DFS
 */
function detectCycle(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  // Build adjacency list
  const adjacency = new Map<string, string[]>()
  nodes.forEach(node => {
    adjacency.set(node.id, [])
  })
  edges.forEach(edge => {
    const sources = adjacency.get(edge.source) || []
    sources.push(edge.target)
    adjacency.set(edge.source, sources)
  })

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true // Cycle detected
    }

    if (visited.has(nodeId)) {
      return false // Already processed
    }

    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjacency.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  // Check from each node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true
      }
    }
  }

  return false
}

/**
 * Quick validation for a single node
 */
export function validateNode(node: WorkflowNode): {
  valid: boolean
  errors: string[]
} {
  const errors = validateNodeConfig(node)
  return {
    valid: errors.length === 0,
    errors,
  }
}
