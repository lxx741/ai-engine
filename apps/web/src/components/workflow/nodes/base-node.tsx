import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface BaseNodeData {
  name: string;
  description?: string;
  config?: Record<string, any>;
  status?: 'default' | 'running' | 'success' | 'error';
}

interface BaseNodeProps extends NodeProps {
  icon: React.ReactNode;
  colorClass: string;
  gradientFrom: string;
  gradientTo: string;
}

export const BaseNode = memo(function BaseNode({
  id,
  data,
  selected,
  icon,
  colorClass,
  gradientFrom,
  gradientTo,
}: BaseNodeProps) {
  const nodeData = data as any;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-lg min-w-[200px] border-2 transition-all',
        `bg-gradient-to-r ${gradientFrom} ${gradientTo}`,
        selected ? 'border-white shadow-xl scale-105' : `${colorClass} border-transparent`
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 text-white">{icon}</div>
        <span className="font-semibold text-white text-sm">{nodeData.name || '未命名节点'}</span>
      </div>

      {/* Description or Config Preview */}
      {nodeData.description && (
        <div className="text-xs text-white/80 mb-2">{nodeData.description}</div>
      )}

      {/* Config Preview */}
      {nodeData.config && Object.keys(nodeData.config).length > 0 && (
        <div className="text-xs text-white/70 bg-white/10 rounded p-2 mt-2">
          {getConfigPreview(nodeData.config)}
        </div>
      )}

      {/* Status Indicator */}
      {nodeData.status && nodeData.status !== 'default' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-white">
          {nodeData.status === 'running' && (
            <div className="w-full h-full bg-blue-400 animate-pulse rounded-full" />
          )}
          {nodeData.status === 'success' && (
            <div className="w-full h-full bg-green-400 rounded-full" />
          )}
          {nodeData.status === 'error' && <div className="w-full h-full bg-red-400 rounded-full" />}
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn('w-3 h-3 border-2 border-white', colorClass.replace('bg-', 'bg-'))}
        style={{ background: 'white' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn('w-3 h-3 border-2 border-white', colorClass.replace('bg-', 'bg-'))}
        style={{ background: 'white' }}
      />
    </div>
  );
});

function getConfigPreview(config: Record<string, any>): string {
  const entries = Object.entries(config);
  if (entries.length === 0) return '未配置';

  const [key, value] = entries[0];
  const valueStr =
    typeof value === 'string'
      ? value.substring(0, 30) + (value.length > 30 ? '...' : '')
      : JSON.stringify(value).substring(0, 30);

  return `${key}: ${valueStr}`;
}

// Node type utilities
export const NODE_TYPES = {
  start: {
    type: 'start',
    label: '开始',
    colorClass: 'bg-emerald-500',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-green-500',
  },
  llm: {
    type: 'llm',
    label: 'LLM',
    colorClass: 'bg-blue-500',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-indigo-500',
  },
  http: {
    type: 'http',
    label: 'HTTP',
    colorClass: 'bg-purple-500',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-pink-500',
  },
  condition: {
    type: 'condition',
    label: '条件',
    colorClass: 'bg-amber-500',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
  },
  end: {
    type: 'end',
    label: '结束',
    colorClass: 'bg-rose-500',
    gradientFrom: 'from-rose-400',
    gradientTo: 'to-red-600',
  },
  tool: {
    type: 'tool',
    label: '工具',
    colorClass: 'bg-orange-500',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-red-500',
  },
} as const;

export type NodeTypeKey = keyof typeof NODE_TYPES;
