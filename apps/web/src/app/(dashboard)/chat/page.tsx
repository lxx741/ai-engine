'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApps } from '@/hooks/use-apps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export default function ChatListPage() {
  const { data: apps, isLoading } = useApps();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">对话</h1>
          <p className="text-muted-foreground">选择一个应用开始对话</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : apps && apps.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {app.name}
                  </CardTitle>
                  {app.description && <CardDescription>{app.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <Link href={`/chat/${app.id}`}>
                    <Button className="w-full">开始对话</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">暂无应用</h2>
            <p className="text-muted-foreground mb-4">请先创建一个应用来开始对话</p>
            <Link href="/apps">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建应用
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
