'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCanvasStore } from './canvas-provider'

interface ConfigPanelProps {
  nodeId: string
  onClose: () => void
}

export function ConfigPanel({ nodeId, onClose }: ConfigPanelProps) {
  const { nodes, updateNodeConfig, deleteNode } = useCanvasStore()
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return null

  const nodeData = node.data as any
  
  const [config, setConfig] = useState(nodeData.config || {})

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    updateNodeConfig(nodeId, newConfig)
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个节点吗？')) {
      deleteNode(nodeId)
      onClose()
    }
  }

  return (
    <div className="w-96 bg-white border-l shadow-lg overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {nodeData.name || node.type}
          </h2>
          <p className="text-xs text-muted-foreground">
            {node.type} 节点
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="node-name">节点名称</Label>
              <Input
                id="node-name"
                value={nodeData.name || ''}
                onChange={(e) => {
                  const newConfig = { ...config, name: e.target.value }
                  setConfig(newConfig)
                  updateNodeConfig(nodeId, newConfig)
                }}
                placeholder="输入节点名称"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="node-desc">描述</Label>
              <Textarea
                id="node-desc"
                value={nodeData.description || ''}
                onChange={(e) => {
                  const newConfig = { ...config, description: e.target.value }
                  setConfig(newConfig)
                  updateNodeConfig(nodeId, newConfig)
                }}
                placeholder="输入节点描述"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Type-specific Config */}
        <Tabs defaultValue="config">
          <TabsList className="w-full">
            <TabsTrigger value="config" className="flex-1">配置</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">高级</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4 mt-4">
            {node.type === 'llm' && (
              <>
                <div className="space-y-2">
                  <Label>模型 ID</Label>
                  <Input
                    value={config.modelId || ''}
                    onChange={(e) => handleConfigChange('modelId', e.target.value)}
                    placeholder="qwen-turbo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>提示词</Label>
                  <Textarea
                    value={config.prompt || ''}
                    onChange={(e) => handleConfigChange('prompt', e.target.value)}
                    placeholder="输入提示词..."
                    rows={6}
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
                      value={config.temperature || 0.7}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={config.maxTokens || 2048}
                      onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}
            
            {node.type === 'http' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>方法</Label>
                    <Select
                      value={config.method || 'GET'}
                      onValueChange={(v) => handleConfigChange('method', v)}
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
                      value={config.url || ''}
                      onChange={(e) => handleConfigChange('url', e.target.value)}
                      placeholder="https://api.example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>请求体 (JSON)</Label>
                  <Textarea
                    value={config.body || ''}
                    onChange={(e) => handleConfigChange('body', e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={6}
                  />
                </div>
              </>
            )}
            
            {node.type === 'condition' && (
              <div className="space-y-2">
                <Label>条件表达式</Label>
                <Textarea
                  value={config.expression || ''}
                  onChange={(e) => handleConfigChange('expression', e.target.value)}
                  placeholder="input.value > 10"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  支持变量引用：{'{{ nodes.xxx.output }}'}
                </p>
              </div>
            )}
            
            {node.type === 'tool' && (
              <>
                <div className="space-y-2">
                  <Label>工具名称</Label>
                  <Input
                    value={config.toolName || ''}
                    onChange={(e) => handleConfigChange('toolName', e.target.value)}
                    placeholder="http, code, time"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>工具参数 (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(config.params || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        handleConfigChange('params', JSON.parse(e.target.value))
                      } catch {}
                    }}
                    rows={8}
                  />
                </div>
              </>
            )}
            
            {node.type === 'start' && (
              <div className="space-y-2">
                <Label>输出变量</Label>
                <Textarea
                  value={JSON.stringify(config.outputs || [], null, 2)}
                  onChange={(e) => {
                    try {
                      handleConfigChange('outputs', JSON.parse(e.target.value))
                    } catch {}
                  }}
                  rows={6}
                  placeholder='[{"name": "input", "type": "string"}]'
                />
              </div>
            )}
            
            {node.type === 'end' && (
              <div className="space-y-2">
                <Label>最终输出</Label>
                <Textarea
                  value={JSON.stringify(config.outputs || [], null, 2)}
                  onChange={(e) => {
                    try {
                      handleConfigChange('outputs', JSON.parse(e.target.value))
                    } catch {}
                  }}
                  rows={6}
                  placeholder='[{"name": "result", "value": "{{ nodes.llm.output }}"}]'
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>超时时间 (秒)</Label>
              <Input
                type="number"
                value={config.timeout || 30}
                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>重试次数</Label>
              <Input
                type="number"
                value={config.retries || 0}
                onChange={(e) => handleConfigChange('retries', parseInt(e.target.value))}
              />
            </div>
            
            <div className="pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                删除节点
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
