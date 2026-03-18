'use client';

import { useApps } from '@/hooks/use-apps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AppsPage() {
  const { data: apps, isLoading, error } = useApps();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">加载失败：{error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的应用</h1>
        <Link href="/apps/new">
          <Button>新建应用</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : apps && apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Link href={`/apps/${app.id}`}>
                  <CardTitle className="text-xl">{app.name}</CardTitle>
                </Link>
                <CardDescription>{app.description || '暂无描述'}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  创建于 {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">暂无应用</p>
          <Link href="/apps/new">
            <Button>创建第一个应用</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
