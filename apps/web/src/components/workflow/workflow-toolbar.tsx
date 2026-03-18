'use client';

import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Download, Upload, Settings, Play } from 'lucide-react';
import { useCanvasStore } from './canvas-provider';

interface WorkflowToolbarProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export function WorkflowToolbar({ onSubmit, onCancel }: WorkflowToolbarProps) {
  const { workflowName, workflowDescription, nodes, edges, clearCanvas, saveToLocalStorage } =
    useCanvasStore();

  const handleSave = () => {
    saveToLocalStorage();
    alert('✅ 工作流已保存到本地');
  };

  const handleExport = () => {
    const data = {
      name: workflowName || 'Untitled Workflow',
      description: workflowDescription,
      definition: {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          config: (node.data as any)?.config || {},
          position: node.position,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          condition: (edge.data as any)?.condition,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(workflowName || 'workflow').toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            // TODO: Import data to canvas
            alert('✅ 工作流导入成功（功能开发中）');
          } catch (error) {
            alert('❌ 导入失败：无效的 JSON 文件');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm('确定要清空画布吗？此操作不可恢复。')) {
      clearCanvas();
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const data = {
        name: workflowName || 'Untitled Workflow',
        description: workflowDescription,
        definition: {
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            config: (node.data as any)?.config || {},
            position: node.position,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            condition: (edge.data as any)?.condition,
          })),
        },
      };
      onSubmit(data);
    }
  };

  return (
    <div className="h-14 bg-white border-b px-4 flex items-center justify-between">
      {/* Left: Workflow Info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold">{workflowName || '未命名工作流'}</h1>
          {workflowDescription && (
            <p className="text-xs text-muted-foreground">{workflowDescription}</p>
          )}
        </div>
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>节点：{nodes.length}</span>
        <span>连线：{edges.length}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleClear} title="清空画布">
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleImport} title="导入 JSON">
          <Upload className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleExport} title="导出 JSON">
          <Download className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleSave} title="保存到本地">
          <Save className="w-4 h-4" />
        </Button>

        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}

        {onSubmit ? (
          <Button variant="default" size="sm" onClick={handleSubmit}>
            <Play className="w-4 h-4 mr-2" />
            运行工作流
          </Button>
        ) : (
          <Button variant="default" size="sm" title="测试工作流">
            <Play className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
