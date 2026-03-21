'use client';

import { useParams } from 'next/navigation';
import { useTool } from '@/hooks/use-tools';
import { ToolDetail } from '@/components/tool/tool-detail';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ToolDetailPage() {
  const params = useParams();
  const { data: tool, isLoading, error } = useTool(params.name as string);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-red-500">工具不存在或加载失败</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回工具列表
          </Button>
        </Link>
      </div>

      <ToolDetail tool={tool} />
    </div>
  );
}
