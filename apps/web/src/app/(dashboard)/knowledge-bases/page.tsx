'use client';

import { useRouter } from 'next/navigation';
import { useApps } from '@/hooks/use-apps';
import {
  useKnowledgeBase,
  useCreateKnowledgeBase,
  useDeleteKnowledgeBase,
} from '@/hooks/use-knowledge-bases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { Brain, Plus, Trash2, Settings, FileText } from 'lucide-react';

export default function KnowledgeBasesPage() {
  const router = useRouter();
  const { data: apps, isLoading: appsLoading } = useApps();
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const { data: knowledgeBase, isLoading: kbLoading } = useKnowledgeBase(
    selectedAppId || undefined
  );
  const createKnowledgeBase = useCreateKnowledgeBase();
  const deleteKnowledgeBase = useDeleteKnowledgeBase();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppId) {
      toast.error('请选择应用');
      return;
    }

    try {
      await createKnowledgeBase.mutateAsync({
        appId: selectedAppId,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });
      toast.success('知识库创建成功');
      setShowCreateForm(false);
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      toast.error(`创建失败：${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!knowledgeBase) return;

    if (!confirm(`确定要删除知识库 "${knowledgeBase.name}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await deleteKnowledgeBase.mutateAsync(knowledgeBase.id);
      toast.success('知识库已删除');
    } catch (error: any) {
      toast.error(`删除失败：${error.response?.data?.message || error.message}`);
    }
  };

  const handleNavigateToDocuments = () => {
    if (knowledgeBase) {
      router.push(`/knowledge-bases/${knowledgeBase.id}/documents`);
    }
  };

  const handleNavigateToSettings = () => {
    if (knowledgeBase) {
      router.push(`/knowledge-bases/${knowledgeBase.id}/settings`);
    }
  };

  if (appsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">知识库管理</h1>
            <p className="text-muted-foreground mt-1">管理您的知识库，上传文档，配置 RAG 检索</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* App Selection */}
        <Card>
          <CardHeader>
            <CardTitle>选择应用</CardTitle>
            <CardDescription>每个应用可以创建一个知识库</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="app">应用</Label>
                <select
                  id="app"
                  className="w-full p-2 border rounded-md"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                >
                  <option value="">选择应用...</option>
                  {apps?.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base Status */}
        {selectedAppId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                知识库状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kbLoading ? (
                <p className="text-muted-foreground">加载中...</p>
              ) : knowledgeBase ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{knowledgeBase.name}</h3>
                      {knowledgeBase.description && (
                        <p className="text-sm text-muted-foreground">{knowledgeBase.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleNavigateToDocuments}>
                        <FileText className="w-4 h-4 mr-2" />
                        文档管理
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNavigateToSettings}>
                        <Settings className="w-4 h-4 mr-2" />
                        配置
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>文档数：{knowledgeBase.documentCount || 0}</span>
                    <span>创建时间：{new Date(knowledgeBase.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建知识库
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>创建知识库</CardTitle>
              <CardDescription>填写知识库基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入知识库名称"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入知识库描述（可选）"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    取消
                  </Button>
                  <Button type="submit">创建</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
