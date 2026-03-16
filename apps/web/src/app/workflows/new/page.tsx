'use client'

import { useRouter } from 'next/navigation'
import { useApps } from '@/hooks/use-apps'
import { useCreateWorkflow } from '@/hooks/use-workflows'
import { WorkflowForm } from '@/components/workflow/workflow-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewWorkflowPage() {
  const router = useRouter()
  const { data: apps, isLoading: appsLoading } = useApps()
  const createWorkflow = useCreateWorkflow()

  const handleSubmit = async (data: any) => {
    try {
      console.log('Creating workflow with data:', JSON.stringify(data, null, 2))
      const workflow = await createWorkflow.mutateAsync(data)
      console.log('Workflow created:', workflow.id)
      router.push(`/workflows/${workflow.id}/edit`)
    } catch (error: any) {
      console.error('创建工作流失败:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      alert(`创建工作流失败：${error.response?.data?.message || error.message || '请重试'}`)
    }
  }

  const handleCancel = () => {
    router.push('/workflows')
  }

  if (appsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">新建工作流</h1>
        <p className="text-muted-foreground mt-1">创建一个新的工作流</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>工作流配置</CardTitle>
          <CardDescription>填写工作流的基本信息并配置节点</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowForm
            apps={apps}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
