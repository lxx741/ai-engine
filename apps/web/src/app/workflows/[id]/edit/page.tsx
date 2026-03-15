'use client'

import { useRouter, useParams } from 'next/navigation'
import { useApps } from '@/hooks/use-apps'
import { useWorkflow, useUpdateWorkflow } from '@/hooks/use-workflows'
import { WorkflowForm } from '@/components/workflow/workflow-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditWorkflowPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string
  
  const { data: workflow, isLoading: workflowLoading } = useWorkflow(workflowId)
  const { data: apps, isLoading: appsLoading } = useApps()
  const updateWorkflow = useUpdateWorkflow()

  const handleSubmit = async (data: any) => {
    try {
      await updateWorkflow.mutateAsync({ id: workflowId, data })
      router.push('/workflows')
    } catch (error) {
      console.error('更新工作流失败:', error)
      alert('更新工作流失败，请重试')
    }
  }

  const handleCancel = () => {
    router.push('/workflows')
  }

  if (workflowLoading || appsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">工作流不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑工作流</h1>
        <p className="text-muted-foreground mt-1">修改工作流配置</p>
      </div>

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
  )
}
