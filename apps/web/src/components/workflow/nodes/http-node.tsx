import { NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { Globe } from 'lucide-react';
import { BaseNode, BaseNodeData, NODE_TYPES } from './base-node';

export type HTTPNodeData = BaseNodeData & {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
  headers?: Record<string, string>;
  body?: string;
};

export const HTTPNode = memo(function HTTPNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<Globe className="w-full h-full" />}
      colorClass={NODE_TYPES.http.colorClass}
      gradientFrom={NODE_TYPES.http.gradientFrom}
      gradientTo={NODE_TYPES.http.gradientTo}
    />
  );
});
