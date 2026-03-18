import { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { StopCircle } from 'lucide-react'
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node'

export type EndNodeData = BaseNodeData & {
  outputs?: Array<{ name: string; value: string }>
}

export const EndNode = memo(function EndNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<StopCircle className="w-full h-full" />}
      colorClass={NODE_TYPES.end.colorClass}
      gradientFrom={NODE_TYPES.end.gradientFrom}
      gradientTo={NODE_TYPES.end.gradientTo}
    />
  )
})
