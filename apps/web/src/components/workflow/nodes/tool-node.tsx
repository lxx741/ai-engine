import { NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { Wrench } from 'lucide-react';
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node';

export type ToolNodeData = BaseNodeData & {
  toolName?: string;
  params?: Record<string, any>;
};

export const ToolNode = memo(function ToolNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<Wrench className="w-full h-full" />}
      colorClass={NODE_TYPES.tool.colorClass}
      gradientFrom={NODE_TYPES.tool.gradientFrom}
      gradientTo={NODE_TYPES.tool.gradientTo}
    />
  );
});
