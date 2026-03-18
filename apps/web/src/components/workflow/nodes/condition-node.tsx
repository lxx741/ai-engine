import { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { GitBranch } from 'lucide-react'
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node'

export type ConditionNodeData = BaseNodeData & {
  expression?: string
  branches?: Array<{ label: string; condition: string }>
}

export const ConditionNode = memo(function ConditionNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<GitBranch className="w-full h-full" />}
      colorClass={NODE_TYPES.condition.colorClass}
      gradientFrom={NODE_TYPES.condition.gradientFrom}
      gradientTo={NODE_TYPES.condition.gradientTo}
    />
  )
})
