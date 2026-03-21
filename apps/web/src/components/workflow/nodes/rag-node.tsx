import { NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { Database } from 'lucide-react';
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node';

export type RAGNodeData = BaseNodeData & {
  knowledgeBaseId?: string;
  query?: string;
  topK?: number;
  similarityThreshold?: number;
  outputFormat?: 'raw' | 'combined';
};

export const RagNode = memo(function RagNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<Database className="w-full h-full" />}
      colorClass={NODE_TYPES.rag.colorClass}
      gradientFrom={NODE_TYPES.rag.gradientFrom}
      gradientTo={NODE_TYPES.rag.gradientTo}
    />
  );
});
