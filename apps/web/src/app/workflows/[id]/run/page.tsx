'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkflow, useRunWorkflow, useWorkflowRuns } from '@/hooks/use-workflows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function RunWorkflowPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string
  
  const [input, setInput] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  
  const { data: workflow, isLoading } = useWorkflow(workflowId)
  const runWorkflow = useRunWorkflow()
  const { data: runs } = useWorkflowRuns(workflowId)
  const [lastRun, setLastRun] = useState<any>(null)

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const result = await runWorkflow.mutateAsync({ id: workflowId, input })
      setLastRun(result)
    } catch (error: any) {
      setLastRun({
        status: 'failed',
        error: error.message || '执行失败',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  const toggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId)
  }

  if (isLoading) {
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

  const variables = workflow.definition?.variables || {}
  const variableKeys = Object.keys(variables)

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workflows">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{workflow.name}</h1>
        <p className="text-muted-foreground mt-1">{workflow.description}</p>
      </div>

      <Tabs defaultValue="run" className="space-y-6">
        <TabsList>
          <TabsTrigger value="run">执行工作流</TabsTrigger>
          <TabsTrigger value="history">执行历史</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>输入参数</CardTitle>
                <CardDescription>
                  {variableKeys.length > 0
                    ? '填写工作流所需的输入变量'
                    : '此工作流不需要输入参数'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {variableKeys.map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {variables[key]?.label || key}
                      {variables[key]?.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {variables[key]?.type === 'text' || variables[key]?.type === 'string' ? (
                      <Textarea
                        id={key}
                        value={input[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={`输入${variables[key]?.label || key}`}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={key}
                        value={input[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={`输入${variables[key]?.label || key}`}
                      />
                    )}
                  </div>
                ))}

                {variableKeys.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    此工作流没有定义输入变量，直接点击执行即可
                  </p>
                )}

                <Button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      执行工作流
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>执行结果</CardTitle>
                <CardDescription>
                  {lastRun
                    ? `状态：${lastRun.status === 'success' ? '成功' : lastRun.status === 'failed' ? '失败' : '运行中'}`
                    : '暂无执行结果'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastRun ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {lastRun.status === 'success' ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          成功
                        </Badge>
                      ) : lastRun.status === 'failed' ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          失败
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          运行中
                        </Badge>
                      )}
                      {lastRun.duration && (
                        <span className="text-sm text-muted-foreground">
                          耗时：{lastRun.duration}ms
                        </span>
                      )}
                    </div>

                    {lastRun.error && (
                      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                        {lastRun.error}
                      </div>
                    )}

                    {lastRun.output && (
                      <div className="space-y-2">
                        <Label>输出</Label>
                        <pre className="bg-muted p-3 rounded-md overflow-auto text-sm max-h-[300px]">
                          {JSON.stringify(lastRun.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    点击执行按钮运行工作流
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>执行历史</CardTitle>
              <CardDescription>查看此工作流的执行记录</CardDescription>
            </CardHeader>
            <CardContent>
              {runs && runs.length > 0 ? (
                <div className="space-y-4">
                  {runs.map((run) => (
                    <div key={run.id} className="space-y-4">
                      {/* 历史记录行 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {run.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : run.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {new Date(run.createdAt).toLocaleString('zh-CN')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              耗时：{run.duration || '-'}ms
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(run.id)}
                        >
                          {expandedRunId === run.id ? '收起' : '查看结果'}
                        </Button>
                      </div>
                      
                      {/* 展开的结果区域 */}
                      {expandedRunId === run.id && (
                        <div className="ml-12 p-4 bg-muted rounded-lg space-y-3">
                          {/* 输入参数 */}
                          {run.input && Object.keys(run.input).length > 0 && (
                            <div className="space-y-2">
                              <Label>输入参数</Label>
                              <pre className="bg-background p-3 rounded-md overflow-auto text-sm max-h-[200px]">
                                {JSON.stringify(run.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {/* 输出结果 */}
                          {run.output && (
                            <div className="space-y-2">
                              <Label>输出结果</Label>
                              <pre className="bg-background p-3 rounded-md overflow-auto text-sm max-h-[300px]">
                                {JSON.stringify(run.output, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {/* 错误信息 */}
                          {run.error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                              {run.error}
                            </div>
                          )}
                          
                          {/* 无结果提示 */}
                          {!run.output && !run.error && run.status === 'success' && (
                            <div className="text-sm text-muted-foreground">
                              执行成功，无输出结果
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  暂无执行记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
