'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { CanvasEditor } from '@/components/workflow/canvas-editor'
import { useCanvasStore } from '@/components/workflow/canvas-provider'
import { validateFlow } from '../../../../packages/core/src/validators/flow-validator'
import { toBackendDSL, createBasicWorkflow } from '@/lib/workflow-dsl'

interface TestResult {
  name: string
  passed: boolean
  message: string
}

export default function WorkflowTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [activeTest, setActiveTest] = useState<'manual' | 'auto'>('manual')
  const [showCanvas, setShowCanvas] = useState(false)
  
  const { 
    nodes, 
    edges, 
    addNode, 
    addEdge, 
    setDefinition,
    clearCanvas,
    saveToLocalStorage,
  } = useCanvasStore()

  // Test suite
  const runTests = async () => {
    const results: TestResult[] = []

    // Test 1: Canvas initialization
    try {
      clearCanvas()
      results.push({
        name: '画布初始化',
        passed: true,
        message: '画布清空成功',
      })
    } catch (error) {
      results.push({
        name: '画布初始化',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 2: Add node
    try {
      const startNode = {
        id: 'test_start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          name: '测试开始节点',
          config: { name: '开始' },
        },
      }
      addNode(startNode)
      results.push({
        name: '添加节点',
        passed: true,
        message: `成功添加节点，当前节点数：${nodes.length + 1}`,
      })
    } catch (error) {
      results.push({
        name: '添加节点',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 3: Add another node
    try {
      const llmNode = {
        id: 'test_llm',
        type: 'llm',
        position: { x: 400, y: 100 },
        data: {
          name: '测试 LLM 节点',
          config: { 
            name: 'LLM',
            prompt: '测试提示词',
            modelId: 'qwen-turbo',
          },
        },
      }
      addNode(llmNode)
      results.push({
        name: '添加第二个节点',
        passed: true,
        message: '成功添加 LLM 节点',
      })
    } catch (error) {
      results.push({
        name: '添加第二个节点',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 4: Add edge
    try {
      const edge = {
        id: 'test_edge_1',
        source: 'test_start',
        target: 'test_llm',
      }
      addEdge(edge)
      results.push({
        name: '添加连线',
        passed: true,
        message: `成功添加连线，当前连线数：${edges.length + 1}`,
      })
    } catch (error) {
      results.push({
        name: '添加连线',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 5: Validate flow
    try {
      const backendDSL = toBackendDSL(nodes, edges)
      const validation = validateFlow(backendDSL.nodes, backendDSL.edges)
      results.push({
        name: '工作流验证',
        passed: validation.valid,
        message: validation.valid 
          ? '验证通过' 
          : `验证失败：${validation.errors.join(', ')}`,
      })
    } catch (error) {
      results.push({
        name: '工作流验证',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 6: Save to localStorage
    try {
      saveToLocalStorage()
      results.push({
        name: '保存到本地',
        passed: true,
        message: '成功保存到 localStorage',
      })
    } catch (error) {
      results.push({
        name: '保存到本地',
        passed: false,
        message: `失败：${error}`,
      })
    }

    // Test 7: Load basic workflow
    try {
      const basicWorkflow = createBasicWorkflow('测试工作流')
      setDefinition(basicWorkflow)
      results.push({
        name: '加载基础工作流',
        passed: true,
        message: '成功加载包含开始和结束节点的工作流',
      })
    } catch (error) {
      results.push({
        name: '加载基础工作流',
        passed: false,
        message: `失败：${error}`,
      })
    }

    setTestResults(results)
  }

  // Auto-run tests on mount
  useEffect(() => {
    if (activeTest === 'auto') {
      runTests()
    }
  }, [])

  const passedCount = testResults.filter(r => r.passed).length
  const failedCount = testResults.filter(r => !r.passed).length

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">可视化编辑器测试</h1>
        <p className="text-muted-foreground">
          测试可视化编排系统的各项功能
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>测试控制</CardTitle>
          <CardDescription>运行自动化测试或手动测试</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={runTests}>
            运行自动化测试
          </Button>
          <Button 
            variant={showCanvas ? 'default' : 'outline'}
            onClick={() => setShowCanvas(!showCanvas)}
          >
            {showCanvas ? '隐藏画布' : '显示画布'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setTestResults([])
              clearCanvas()
            }}
          >
            重置
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>测试结果</CardTitle>
                <CardDescription>
                  通过 {passedCount} 项，失败 {failedCount} 项
                </CardDescription>
              </div>
              <Badge variant={failedCount === 0 ? 'default' : 'destructive'}>
                {failedCount === 0 ? '全部通过' : `${failedCount} 项失败`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Test Canvas */}
      {showCanvas && (
        <Card>
          <CardHeader>
            <CardTitle>手动测试画布</CardTitle>
            <CardDescription>
              在画布上拖拽节点、连线、配置，测试各项功能
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[600px]">
            <CanvasEditor />
          </CardContent>
        </Card>
      )}

      {/* Test Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>手动测试指南</CardTitle>
          <CardDescription>按照以下步骤进行手动测试</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li>
              <strong>拖拽测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                从左侧工具箱拖拽节点到画布
              </p>
            </li>
            <li>
              <strong>连线测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                从节点的输出点拖拽到另一个节点的输入点
              </p>
            </li>
            <li>
              <strong>配置测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                点击节点，在右侧面板配置参数
              </p>
            </li>
            <li>
              <strong>删除测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                选中节点，按 Delete 或 Backspace 键删除
              </p>
            </li>
            <li>
              <strong>撤销/重做测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                按 Ctrl+Z 撤销，Ctrl+Y 或 Ctrl+Shift+Z 重做
              </p>
            </li>
            <li>
              <strong>保存测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                点击工具栏保存按钮，刷新页面验证数据保留
              </p>
            </li>
            <li>
              <strong>导入/导出测试</strong>
              <p className="text-sm text-muted-foreground ml-6">
                导出 JSON 文件，然后重新导入
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
