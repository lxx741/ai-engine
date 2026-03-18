import { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { Play } from 'lucide-react'
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node'

export type StartNodeData = BaseNodeData & {
  outputs?: Array<{ name: string; type: string }>
}

export const StartNode = memo(function StartNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<Play className="w-full h-full" />}
      colorClass={NODE_TYPES.start.colorClass}
      gradientFrom={NODE_TYPES.start.gradientFrom}
      gradientTo={NODE_TYPES.start.gradientTo}
    />
  )
})
