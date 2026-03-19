'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Download, Upload, Settings, Play, Trash } from 'lucide-react';
import { useCanvasStore } from './canvas-provider';
import {
  TemplateLibraryButton,
  UndoButton,
  RedoButton,
  AutoLayoutButton,
  ValidateButton,
  PreviewButton,
} from './toolbar-buttons';
import { TemplateSelector } from './template-selector';
import { ValidationPanel } from './validation-panel';
import type { WorkflowTemplate } from './templates';
import { autoLayout } from '@/lib/auto-layout';
import { validateWorkflow, getValidationStats } from '@/lib/workflow-validation';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows';

interface WorkflowToolbarProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export function WorkflowToolbar({ onSubmit, onCancel }: WorkflowToolbarProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const {
    workflowName,
    workflowDescription,
    nodes,
    edges,
    clearCanvas,
    saveToLocalStorage,
    applyTemplate,
    setWorkflowName,
    setWorkflowDescription,
    history,
    undo,
    redo,
    autoLayout: layoutCanvas,
    validate,
    setSelectedNode,
  } = useCanvasStore();

  // Computed properties (reactive)
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleUndo = () => {
    console.log('[Toolbar] Undo button clicked');
    undo();
  };

  const handleRedo = () => {
    console.log('[Toolbar] Redo button clicked');
    redo();
  };

  const handleAutoLayout = () => {
    console.log('[Toolbar] Auto-layout button clicked');
    layoutCanvas('horizontal');
  };

  const handleValidate = () => {
    const errors = validate();
    setValidationErrors(errors);
    setShowValidation(true);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    setShowValidation(false);
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    // Convert template nodes to React Flow Node format
    const rfNodes: Node[] = template.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      data: {
        name: node.config?.name || node.type,
        description: node.config?.description,
        config: node.config || {},
      },
    }));

    // Convert template edges to React Flow Edge format
    const rfEdges: Edge[] = template.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        condition: edge.condition,
      },
    }));

    // Auto-layout the nodes
    const workflowNodes: WorkflowNode[] = template.nodes;
    const workflowEdges: WorkflowEdge[] = template.edges;
    const layoutedNodes = autoLayout(workflowNodes, workflowEdges, {
      direction: 'horizontal',
      spacingX: 300,
      spacingY: 150,
    }).map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      data: {
        name: node.config?.name || node.type,
        description: node.config?.description,
        config: node.config || {},
      },
    }));

    // Apply template to canvas
    applyTemplate(layoutedNodes, rfEdges, template.name, template.description);
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

            // Import data to canvas
            if (data.definition) {
              applyTemplate(
                (data.definition.nodes || []).map((node: any) => ({
                  id: node.id,
                  type: node.type,
                  position: node.position || { x: 100, y: 100 },
                  data: {
                    name: node.config?.name || node.type,
                    description: node.config?.description,
                    config: node.config || {},
                  },
                })),
                (data.definition.edges || []).map((edge: any) => ({
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                  data: {
                    condition: edge.condition,
                  },
                })),
                data.name || 'Imported Workflow',
                data.description
              );
            } else if (data.nodes && data.edges) {
              applyTemplate(
                data.nodes,
                data.edges,
                data.name || 'Imported Workflow',
                data.description
              );
            }

            if (data.name) setWorkflowName(data.name);
            if (data.description) setWorkflowDescription(data.description);

            alert('✅ 工作流导入成功');
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

  // State for editing workflow name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(workflowName || '');

  return (
    <>
      <div className="h-14 bg-white border-b px-4 flex items-center justify-between">
        {/* Left: Workflow Info */}
        <div className="flex items-center gap-4">
          {isEditingName ? (
            <input
              className="w-64 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => {
                setWorkflowName(editingName);
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setWorkflowName(editingName);
                  setIsEditingName(false);
                }
                if (e.key === 'Escape') {
                  setEditingName(workflowName || '');
                  setIsEditingName(false);
                }
              }}
              autoFocus
            />
          ) : (
            <div
              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
              onClick={() => {
                setEditingName(workflowName || '');
                setIsEditingName(true);
              }}
              title="点击编辑工作流名称"
            >
              <h1 className="text-lg font-semibold">{workflowName || '未命名工作流'}</h1>
              {workflowDescription && (
                <p className="text-xs text-muted-foreground">{workflowDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Center: Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>节点：{nodes.length}</span>
          <span>连线：{edges.length}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <TemplateLibraryButton onClick={() => setShowTemplateSelector(true)} title="模板库" />

          <UndoButton onClick={handleUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)" />
          <RedoButton onClick={handleRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)" />
          <AutoLayoutButton onClick={handleAutoLayout} title="自动布局" />

          <ValidateButton
            onClick={handleValidate}
            errorCount={getValidationStats(validationErrors).errors}
            title="验证工作流"
          />

        <Button variant="outline" size="sm" onClick={handleClear} title="清空画布">
          <Trash className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleImport} title="导入 JSON">
          <Upload className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleExport} title="导出 JSON">
          <Download className="w-4 h-4" />
        </Button>

          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              取消
            </Button>
          )}

        {onSubmit ? (
          <Button variant="default" size="sm" onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            保存并返回
          </Button>
          ) : (
            <Button variant="default" size="sm" title="测试工作流">
              <Play className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {showValidation && (
        <ValidationPanel
          errors={validationErrors}
          onClose={() => setShowValidation(false)}
          onNodeSelect={handleNodeSelect}
        />
      )}
    </>
  );
}
