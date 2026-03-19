import type { WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows';

export interface ValidationError {
  type: 'warning' | 'error';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

/**
 * 验证工作流的有效性
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. 检查是否有开始节点
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      type: 'error',
      message: '工作流必须包含一个开始节点',
    });
  }
  if (startNodes.length > 1) {
    errors.push({
      type: 'warning',
      message: '工作流包含多个开始节点，建议只保留一个',
    });
  }

  // 2. 检查是否有结束节点
  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      type: 'warning',
      message: '工作流没有结束节点',
    });
  }

  // 3. 检查孤立节点（没有输入也没有输出）
  nodes.forEach((node) => {
    if (node.type === 'start' || node.type === 'end') return;

    const hasInput = edges.some((e) => e.target === node.id);
    const hasOutput = edges.some((e) => e.source === node.id);

    if (!hasInput && !hasOutput) {
      errors.push({
        type: 'warning',
        message: `节点 "${node.config?.name || node.type}" 未连接到其他节点`,
        nodeId: node.id,
      });
    }
  });

  // 4. 检查循环依赖
  if (hasCycle(nodes, edges)) {
    errors.push({
      type: 'error',
      message: '工作流存在循环依赖，请检查节点连接',
    });
  }

  // 5. 检查必填字段
  nodes.forEach((node) => {
    if (node.type === 'llm' && !node.config?.prompt) {
      errors.push({
        type: 'error',
        message: `LLM 节点 "${node.config?.name || node.type}" 缺少提示词配置`,
        nodeId: node.id,
      });
    }

    if (node.type === 'http' && !node.config?.url) {
      errors.push({
        type: 'error',
        message: `HTTP 节点 "${node.config?.name || node.type}" 缺少 URL 配置`,
        nodeId: node.id,
      });
    }

    if (node.type === 'condition' && !node.config?.expression) {
      errors.push({
        type: 'error',
        message: `条件节点 "${node.config?.name || node.type}" 缺少条件表达式`,
        nodeId: node.id,
      });
    }
  });

  // 6. 检查边的有效性
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode) {
      errors.push({
        type: 'error',
        message: `边的源节点不存在`,
        edgeId: edge.id,
      });
    }

    if (!targetNode) {
      errors.push({
        type: 'error',
        message: `边的目标节点不存在`,
        edgeId: edge.id,
      });
    }

    // 检查条件边的条件值
    if (sourceNode?.type === 'condition' && !edge.condition) {
      errors.push({
        type: 'warning',
        message: `条件节点的输出边缺少条件标注`,
        edgeId: edge.id,
      });
    }
  });

  return errors;
}

/**
 * 检测图中是否存在循环依赖
 * 使用深度优先搜索 (DFS)
 */
function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // 构建邻接表
  nodes.forEach((node) => {
    adjacency.set(node.id, []);
  });

  edges.forEach((edge) => {
    const sources = adjacency.get(edge.source) || [];
    sources.push(edge.target);
    adjacency.set(edge.source, sources);
  });

  // DFS 检测循环
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // 发现循环
    }

    if (visited.has(nodeId)) {
      return false; // 已访问过
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (dfs(neighborId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // 从每个节点开始 DFS
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 获取验证结果的统计信息
 */
export function getValidationStats(errors: ValidationError[]) {
  return {
    total: errors.length,
    errors: errors.filter((e) => e.type === 'error').length,
    warnings: errors.filter((e) => e.type === 'warning').length,
  };
}
