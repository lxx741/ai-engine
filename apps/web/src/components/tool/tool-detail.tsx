'use client';

import { Tool, ToolExecutionResult } from '@/hooks/use-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { SchemaForm } from './schema-form';
import { useExecuteTool } from '@/hooks/use-tools';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ToolDetailProps {
  tool: Tool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ToolExecutionResult | null>(null);
  const executeTool = useExecuteTool();

  const handleExecute = async () => {
    try {
      const res = await executeTool.mutateAsync({
        name: tool.name,
        params,
      });
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
      });
    }
  };

  const handleReset = () => {
    setParams({});
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tool.name}
            <Badge variant="default">可用</Badge>
          </CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* 参数定义 */}
      {tool.parameters && (
        <Card>
          <CardHeader>
            <CardTitle>参数定义</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(tool.parameters, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 在线测试 */}
      <Card>
        <CardHeader>
          <CardTitle>在线测试</CardTitle>
          <CardDescription>填写参数并执行工具</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tool.parameters?.properties ? (
            <SchemaForm schema={tool.parameters} value={params} onChange={setParams} />
          ) : (
            <p className="text-gray-500">该工具无需参数</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleExecute} disabled={executeTool.isPending}>
              {executeTool.isPending ? '执行中...' : '执行工具'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>

          {/* 执行结果 */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-semibold">{result.success ? '执行成功' : '执行失败'}</p>
                  {result.output && (
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  )}
                  {result.error && <p className="mt-2 text-red-600">{result.error}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
