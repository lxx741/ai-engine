'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateApp } from '@/hooks/use-apps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewAppPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createApp = useCreateApp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const app = await createApp.mutateAsync({ name, description })
      router.push(`/apps/${app.id}`)
    } catch (error) {
      alert('创建失败：' + (error as Error).message)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>创建新应用</CardTitle>
          <CardDescription>
            填写以下信息创建您的 AI 应用
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">应用名称 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：智能客服助手"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">应用描述</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述应用用途"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={createApp.isPending}
              >
                {createApp.isPending ? '创建中...' : '创建应用'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
