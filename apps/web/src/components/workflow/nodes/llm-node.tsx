import { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { Bot } from 'lucide-react'
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node'

export type LLMNodeData = BaseNodeData & {
  modelId?: string
  prompt?: string
  temperature?: number
  maxTokens?: number
}

export const LLMNode = memo(function LLMNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<Bot className="w-full h-full" />}
      colorClass={NODE_TYPES.llm.colorClass}
      gradientFrom={NODE_TYPES.llm.gradientFrom}
      gradientTo={NODE_TYPES.llm.gradientTo}
    />
  )
})
