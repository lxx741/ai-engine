'use client';

import { Tool } from '@/hooks/use-tools';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ToolListProps {
  tools: Tool[];
  isLoading?: boolean;
}

export function ToolList({ tools, isLoading }: ToolListProps) {
  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!tools || tools.length === 0) {
    return <div className="text-center py-12 text-gray-500">暂无工具</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>参数</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools.map((tool) => (
          <TableRow key={tool.name}>
            <TableCell className="font-medium">{tool.name}</TableCell>
            <TableCell className="max-w-md truncate">{tool.description || '-'}</TableCell>
            <TableCell>
              {tool.parameters?.properties ? (
                <Badge variant="secondary">
                  {Object.keys(tool.parameters.properties).length} 个参数
                </Badge>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <Badge variant="default">可用</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/tools/${tool.name}`}>
                <Button variant="outline" size="sm">
                  查看详情
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
