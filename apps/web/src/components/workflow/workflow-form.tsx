'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Workflow, WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows'
import { NodeEditor } from './node-editor'

interface WorkflowFormProps {
  workflow?: Workflow
  apps?: any[]
  onSubmit: (data: Partial<Workflow>) => void
  onCancel: () => void
}

export function WorkflowForm({ workflow, apps, onSubmit, onCancel }: WorkflowFormProps) {
  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [appId, setAppId] = useState(workflow?.appId || apps?.[0]?.id || '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(workflow?.status || 'draft')
  const [definition, setDefinition] = useState<Workflow['definition']>(workflow?.definition || {
    nodes: [],
    edges: [],
    variables: {},
  })
  const [activeTab, setActiveTab] = useState<'basic' | 'nodes' | 'preview'>('basic')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      appId,
      name,
      description,
      status,
      definition,
    })
  }

  const handleAddNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      config: getDefaultNodeConfig(type),
      position: { x: 100, y: 100 },
    }
    setDefinition(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))
  }

  const handleUpdateNode = (nodeId: string, config: Record<string, any>) => {
    setDefinition(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, config } : node
      ),
    }))
  }

  const handleDeleteNode = (nodeId: string) => {
    setDefinition(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
    }))
  }

  const handleAddEdge = (edge: Omit<WorkflowEdge, 'id'>) => {
    const newEdge: WorkflowEdge = {
      ...edge,
      id: `edge_${Date.now()}`,
    }
    setDefinition(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }))
  }

  const handleDeleteEdge = (edgeId: string) => {
    setDefinition(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-2 mb-6">
        <Button
          type="button"
          variant={activeTab === 'basic' ? 'default' : 'outline'}
          onClick={() => setActiveTab('basic')}
        >
          基本信息
        </Button>
        <Button
          type="button"
          variant={activeTab === 'nodes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('nodes')}
        >
          节点配置
        </Button>
        <Button
          type="button"
          variant={activeTab === 'preview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('preview')}
        >
          JSON 预览
        </Button>
      </div>

      {activeTab === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>配置工作流的基本属性</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">工作流名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入工作流名称"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入工作流描述"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app">所属应用</Label>
              <Select value={appId} onValueChange={setAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择应用" />
                </SelectTrigger>
                <SelectContent>
                  {apps?.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'nodes' && (
        <NodeEditor
          nodes={definition.nodes}
          edges={definition.edges}
          onAddNode={handleAddNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onAddEdge={handleAddEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      )}

      {activeTab === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>JSON 预览</CardTitle>
            <CardDescription>工作流定义的 JSON 表示</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(definition, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          {workflow ? '更新工作流' : '创建工作流'}
        </Button>
      </div>
    </form>
  )
}

function getDefaultNodeConfig(type: WorkflowNode['type']): Record<string, any> {
  switch (type) {
    case 'start':
      return {
        name: '开始节点',
        outputs: [{ name: 'output', type: 'string' }],
      }
    case 'llm':
      return {
        name: 'LLM 节点',
        modelId: '',
        prompt: '',
        temperature: 0.7,
        maxTokens: 2048,
      }
    case 'http':
      return {
        name: 'HTTP 请求',
        method: 'GET',
        url: '',
        headers: {},
        body: '',
      }
    case 'condition':
      return {
        name: '条件判断',
        conditions: [],
      }
    case 'end':
      return {
        name: '结束节点',
        outputs: [{ name: 'result', value: '' }],
      }
    default:
      return { name: '未命名节点' }
  }
}
