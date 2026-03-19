'use client';

import { useState } from 'react';
import { Variable, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCanvasStore } from './canvas-provider';

interface VariablePickerProps {
  onSelect: (variable: string) => void;
}

interface VariableItem {
  name: string;
  label: string;
  type: string;
  category: 'system' | 'node' | 'input';
}

export function VariablePicker({ onSelect }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const { nodes } = useCanvasStore();

  const variables: VariableItem[] = [
    // System variables
    { name: 'workflowId', label: '工作流 ID', type: 'string', category: 'system' },
    { name: 'runId', label: '运行 ID', type: 'string', category: 'system' },
    { name: 'startTime', label: '开始时间', type: 'string', category: 'system' },
    { name: 'userId', label: '用户 ID', type: 'string', category: 'system' },

    // Input variables
    { name: 'query', label: '用户输入', type: 'string', category: 'input' },
    { name: 'context', label: '上下文', type: 'string', category: 'input' },
    { name: 'history', label: '对话历史', type: 'array', category: 'input' },

    // Node outputs
    ...nodes.flatMap((node) => {
      const nodeName = (node.data as any)?.name || node.type;
      const nodeId = node.id;
      return [
        {
          name: `nodes.${nodeId}.output`,
          label: `${nodeName} - 输出`,
          type: 'any',
          category: 'node' as const,
        },
      ];
    }),
  ];

  const handleSelect = (variable: VariableItem) => {
    onSelect(`{{ ${variable.name} }}`);
    setOpen(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'node':
        return 'bg-green-100 text-green-800';
      case 'input':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Variable className="w-4 h-4 mr-2" />
          变量
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-semibold text-sm">插入变量</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setOpen(false)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-1">
            {variables.map((variable, index) => (
              <button
                key={`${variable.name}-${index}`}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors group"
                onClick={() => handleSelect(variable)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {variable.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getCategoryColor(variable.category)}`}
                      >
                        {variable.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {variable.name}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {variable.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            点击变量插入到输入框，使用 {'{{ }}'} 语法引用
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
