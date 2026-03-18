'use client';

import { useParams } from 'next/navigation';
import { useApp, useDeleteApp } from '@/hooks/use-apps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AppDetailPage() {
  const params = useParams();
  const { data: app, isLoading } = useApp(params.id as string);
  const deleteApp = useDeleteApp();

  const copyApiKey = () => {
    if (app?.apiKey) {
      navigator.clipboard.writeText(app.apiKey);
      alert('✅ API Key 已复制到剪贴板');
    }
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这个应用吗？此操作不可恢复。')) {
      try {
        await deleteApp.mutateAsync(params.id as string);
        alert('✅ 应用已删除');
        window.location.href = '/apps';
      } catch (error) {
        alert('删除失败：' + (error as Error).message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">应用不存在</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/apps">
          <Button variant="outline">← 返回应用列表</Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteApp.isPending}>
          {deleteApp.isPending ? '删除中...' : '删除应用'}
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{app.name}</CardTitle>
          <CardDescription>{app.description || '暂无描述'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">API Key</h3>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono break-all">
                {app.apiKey}
              </code>
              <Button onClick={copyApiKey} variant="outline">
                复制
              </Button>
            </div>
            <p className="text-xs text-gray-500">使用此 API Key 调用后端接口</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">模型配置</h3>
            <p className="text-sm">{app.modelId || '未设置（使用默认模型）'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-sm font-semibold">创建时间</h3>
              <p className="text-gray-600">{new Date(app.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">更新时间</h3>
              <p className="text-gray-600">{new Date(app.updatedAt).toLocaleString('zh-CN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
