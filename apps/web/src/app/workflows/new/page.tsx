'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApps } from '@/hooks/use-apps';
import { useCreateWorkflow } from '@/hooks/use-workflows';
import { WorkflowForm } from '@/components/workflow/workflow-form';
import { CanvasEditor } from '@/components/workflow/canvas-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isFeatureEnabled } from '@/lib/features';

export default function NewWorkflowPage() {
  const router = useRouter();
  const { data: apps, isLoading: appsLoading } = useApps();
  const createWorkflow = useCreateWorkflow();

  // Clear canvas cache when creating new workflow
  useEffect(() => {
    localStorage.removeItem('workflow-canvas-state');
    console.log('[NewWorkflow] Cleared canvas cache');
  }, []);

  // Check if visual editor is enabled
  const useVisualEditor = isFeatureEnabled('VISUAL_EDITOR');

  const handleSubmit = async (data: any) => {
    try {
      console.log('Creating workflow with data:', JSON.stringify(data, null, 2));

      // Auto-add appId if not present
      const submitData = { ...data };
      if (!submitData.appId && apps && apps.length > 0) {
        submitData.appId = apps[0].id;
      }

      const workflow = await createWorkflow.mutateAsync(submitData);
      console.log('Workflow created:', workflow.id);
      router.push(`/workflows/${workflow.id}/edit`);
    } catch (error: any) {
      console.error('创建工作流失败:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`创建工作流失败：${error.response?.data?.message || error.message || '请重试'}`);
    }
  };

  const handleCancel = () => {
    router.push('/workflows');
  };

  if (appsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto p-6 flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {useVisualEditor ? '新建工作流（可视化）' : '新建工作流'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {useVisualEditor ? '使用可视化编辑器创建工作流' : '创建一个新的工作流'}
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
                <CardDescription>填写工作流的基本信息并配置节点</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowForm apps={apps} onSubmit={handleSubmit} onCancel={handleCancel} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
