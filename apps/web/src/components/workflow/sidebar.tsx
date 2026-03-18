'use client'

import { Play, Bot, Globe, GitBranch, StopCircle, Wrench } from 'lucide-react'

const NODE_TYPES = [
  { 
    type: 'start', 
    label: '开始节点', 
    icon: Play, 
    color: 'bg-emerald-500',
    description: '工作流起点，定义输入变量'
  },
  { 
    type: 'llm', 
    label: 'LLM 调用', 
    icon: Bot, 
    color: 'bg-blue-500',
    description: '调用大语言模型生成内容'
  },
  { 
    type: 'http', 
    label: 'HTTP 请求', 
    icon: Globe, 
    color: 'bg-purple-500',
    description: '发送 HTTP/HTTPS 请求'
  },
  { 
    type: 'condition', 
    label: '条件判断', 
    icon: GitBranch, 
    color: 'bg-amber-500',
    description: '根据条件分支执行不同路径'
  },
  { 
    type: 'tool', 
    label: '工具调用', 
    icon: Wrench, 
    color: 'bg-orange-500',
    description: '调用预定义工具（代码/时间等）'
  },
  { 
    type: 'end', 
    label: '结束节点', 
    icon: StopCircle, 
    color: 'bg-rose-500',
    description: '工作流终点，输出结果'
  },
]

export function Sidebar() {
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-64 bg-white border-r shadow-sm overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">节点工具箱</h2>
        <p className="text-sm text-muted-foreground mb-4">
          拖拽节点到画布
        </p>
        
        <div className="space-y-3">
          {NODE_TYPES.map(({ type, label, icon: Icon, color, description }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="group cursor-move"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">
                    {label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 使用提示
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 拖拽节点到画布添加</li>
            <li>• 从节点边缘拖拽创建连线</li>
            <li>• 点击节点查看详情</li>
            <li>• Delete/Backspace 删除选中</li>
            <li>• 滚轮缩放，拖拽平移画布</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
