'use client';

import { useRouter, useParams } from 'next/navigation';
import { useApps } from '@/hooks/use-apps';
import { useWorkflow, useUpdateWorkflow } from '@/hooks/use-workflows';
import { WorkflowForm } from '@/components/workflow/workflow-form';
import { CanvasEditor } from '@/components/workflow/canvas-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isFeatureEnabled } from '@/lib/features';
import { useEffect } from 'react';
import { useCanvasStore } from '@/components/workflow/canvas-provider';

export default function EditWorkflowPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const { data: workflow, isLoading: workflowLoading } = useWorkflow(workflowId);
  const { data: apps, isLoading: appsLoading } = useApps();
  const updateWorkflow = useUpdateWorkflow();
  const { setDefinition, setWorkflowName, setWorkflowDescription } = useCanvasStore();

  // Check if visual editor is enabled
  const useVisualEditor = isFeatureEnabled('VISUAL_EDITOR');

  // Initialize canvas with workflow definition
  useEffect(() => {
    if (workflow && useVisualEditor && workflow.definition) {
      setDefinition(workflow.definition);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
    }
  }, [workflow, useVisualEditor, setDefinition, setWorkflowName, setWorkflowDescription]);

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting workflow update:', JSON.stringify(data, null, 2));
      await updateWorkflow.mutateAsync({ id: workflowId, data });
      router.push('/workflows');
    } catch (error: any) {
      console.error('更新工作流失败:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`更新工作流失败：${error.response?.data?.message || error.message || '未知错误'}`);
    }
  };

  const handleCancel = () => {
    router.push('/workflows');
  };

  if (workflowLoading || appsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">工作流不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto p-6 flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {useVisualEditor ? '编辑工作流（可视化）' : '编辑工作流'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {useVisualEditor ? '使用可视化编辑器修改工作流' : '修改工作流配置'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {useVisualEditor ? (
          <CanvasEditor onSubmit={handleSubmit} onCancel={handleCancel} />
        ) : (
          <div className="container mx-auto p-6 max-w-5xl overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>工作流配置</CardTitle>
                <CardDescription>修改工作流的基本信息和节点配置</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowForm
                  workflow={workflow}
                  apps={apps}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
