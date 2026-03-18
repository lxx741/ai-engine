'use client';

import { useTools } from '@/hooks/use-tools';
import { ToolList } from '@/components/tool/tool-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ToolsPage() {
  const { data: tools, isLoading } = useTools();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">工具管理</h1>
          <p className="text-gray-500 mt-1">管理和测试可用的工具</p>
        </div>
        <Link href="/workflows">
          <Button variant="outline">管理工作流</Button>
        </Link>
      </div>

      <ToolList tools={tools || []} isLoading={isLoading} />
    </div>
  );
}
