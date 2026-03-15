'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows'
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react'

interface NodeEditorProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  onAddNode: (type: WorkflowNode['type']) => void
  onUpdateNode: (nodeId: string, config: Record<string, any>) => void
  onDeleteNode: (nodeId: string) => void
  onAddEdge: (edge: Omit<WorkflowEdge, 'id'>) => void
  onDeleteEdge: (edgeId: string) => void
}

export function NodeEditor({
  nodes,
  edges,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
}: NodeEditorProps) {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [edgeSource, setEdgeSource] = useState<string>('')

  const nodeTypes: { type: WorkflowNode['type']; label: string; color: string }[] = [
    { type: 'start', label: '开始', color: 'bg-green-500' },
    { type: 'llm', label: 'LLM', color: 'bg-blue-500' },
    { type: 'http', label: 'HTTP', color: 'bg-purple-500' },
    { type: 'condition', label: '条件', color: 'bg-yellow-500' },
    { type: 'end', label: '结束', color: 'bg-red-500' },
  ]

  const handleNodeConfigChange = (key: string, value: any) => {
    if (!selectedNode) return
    onUpdateNode(selectedNode.id, {
      ...selectedNode.config,
      [key]: value,
    })
    setSelectedNode({
      ...selectedNode,
      config: {
        ...selectedNode.config,
        [key]: value,
      },
    })
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">节点列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {nodeTypes.map(({ type, label, color }) => (
              <Button
                key={type}
                variant="outline"
                className="justify-start"
                onClick={() => onAddNode(type)}
              >
                <span className={`w-2 h-2 rounded-full ${color} mr-2`} />
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>已添加节点</Label>
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className={`flex items-center justify-between p-2 rounded-md border cursor-pointer ${
                  selectedNode?.id === node.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    nodeTypes.find(t => t.type === node.type)?.color
                  }`} />
                  <span className="text-sm">{node.config.name || node.type}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (index > 0) {
                        const newNodes = [...nodes]
                        ;[newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]]
                      }
                    }}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (index < nodes.length - 1) {
                        const newNodes = [...nodes]
                        ;[newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]]
                      }
                    }}
                    disabled={index === nodes.length - 1}
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteNode(node.id)
                      if (selectedNode?.id === node.id) setSelectedNode(null)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>边连接</Label>
            {edges.map((edge) => (
              <div
                key={edge.id}
                className="flex items-center justify-between p-2 rounded-md border text-sm"
              >
                <span>
                  {nodes.find(n => n.id === edge.source)?.config.name || edge.source}
                  {' -> '}
                  {nodes.find(n => n.id === edge.target)?.config.name || edge.target}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => onDeleteEdge(edge.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">节点配置</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <Tabs defaultValue="config">
              <TabsList>
                <TabsTrigger value="config">配置</TabsTrigger>
                <TabsTrigger value="edge">边配置</TabsTrigger>
              </TabsList>
              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>节点名称</Label>
                  <Input
                    value={selectedNode.config.name || ''}
                    onChange={(e) => handleNodeConfigChange('name', e.target.value)}
                  />
                </div>

                {selectedNode.type === 'llm' && (
                  <>
                    <div className="space-y-2">
                      <Label>模型 ID</Label>
                      <Input
                        value={selectedNode.config.modelId || ''}
                        onChange={(e) => handleNodeConfigChange('modelId', e.target.value)}
                        placeholder="输入模型 ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>提示词</Label>
                      <Textarea
                        value={selectedNode.config.prompt || ''}
                        onChange={(e) => handleNodeConfigChange('prompt', e.target.value)}
                        placeholder="输入提示词"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={selectedNode.config.temperature || 0.7}
                          onChange={(e) => handleNodeConfigChange('temperature', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          value={selectedNode.config.maxTokens || 2048}
                          onChange={(e) => handleNodeConfigChange('maxTokens', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedNode.type === 'http' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>方法</Label>
                        <Select
                          value={selectedNode.config.method || 'GET'}
                          onValueChange={(v) => handleNodeConfigChange('method', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={selectedNode.config.url || ''}
                          onChange={(e) => handleNodeConfigChange('url', e.target.value)}
                          placeholder="https://api.example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>请求体</Label>
                      <Textarea
                        value={selectedNode.config.body || ''}
                        onChange={(e) => handleNodeConfigChange('body', e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <div className="space-y-2">
                    <Label>条件表达式</Label>
                    <Textarea
                      value={selectedNode.config.expression || ''}
                      onChange={(e) => handleNodeConfigChange('expression', e.target.value)}
                      placeholder="input.value > 10"
                      rows={3}
                    />
                  </div>
                )}

                {selectedNode.type === 'end' && (
                  <div className="space-y-2">
                    <Label>输出变量</Label>
                    <Textarea
                      value={JSON.stringify(selectedNode.config.outputs || [], null, 2)}
                      onChange={(e) => {
                        try {
                          handleNodeConfigChange('outputs', JSON.parse(e.target.value))
                        } catch {}
                      }}
                      rows={4}
                    />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="edge" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>添加边</Label>
                  <div className="flex gap-2">
                    <Select value={edgeSource} onValueChange={setEdgeSource}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="选择源节点" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes
                          .filter(n => n.id !== selectedNode.id)
                          .map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.config.name || node.type}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (edgeSource) {
                          onAddEdge({
                            source: selectedNode.id,
                            target: edgeSource,
                          })
                          setEdgeSource('')
                        }
                      }}
                      disabled={!edgeSource}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>输出边</Label>
                  {edges
                    .filter(e => e.source === selectedNode.id)
                    .map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between p-2 rounded-md border text-sm"
                      >
                        <span>
                          {'-> '}
                          {nodes.find(n => n.id === edge.target)?.config.name || edge.target}
                        </span>
                        <div className="flex gap-2">
                          <Input
                            className="w-[150px] h-8"
                            placeholder="条件表达式"
                            value={edge.condition || ''}
                            onChange={(e) => {
                              // Update edge condition
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onDeleteEdge(edge.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              选择一个节点进行配置
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
