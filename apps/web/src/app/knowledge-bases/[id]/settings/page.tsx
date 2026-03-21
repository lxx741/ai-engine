'use client';

import { useParams, useRouter } from 'next/navigation';
import { useKnowledgeBase, useUpdateKnowledgeBase } from '@/hooks/use-knowledge-bases';
import { useKnowledgeBaseStats } from '@/hooks/use-knowledge-bases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Settings, Save, Database, HardDrive } from 'lucide-react';
import { DEFAULT_RAG_CONFIG, calculateQuotaDisplay } from '@/lib/rag-config';

export default function KnowledgeBaseSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.id as string;

  const { data: knowledgeBase } = useKnowledgeBase(knowledgeBaseId);
  const { data: stats } = useKnowledgeBaseStats(knowledgeBaseId);
  const updateKnowledgeBase = useUpdateKnowledgeBase();

  const [config, setConfig] = useState({
    chunkSize: DEFAULT_RAG_CONFIG.chunkSize,
    chunkOverlap: DEFAULT_RAG_CONFIG.chunkOverlap,
    similarityThreshold: DEFAULT_RAG_CONFIG.similarityThreshold,
    maxResults: DEFAULT_RAG_CONFIG.maxResults,
  });

  useEffect(() => {
    if (knowledgeBase?.config) {
      setConfig({
        chunkSize: knowledgeBase.config.chunkSize || DEFAULT_RAG_CONFIG.chunkSize,
        chunkOverlap: knowledgeBase.config.chunkOverlap || DEFAULT_RAG_CONFIG.chunkOverlap,
        similarityThreshold: knowledgeBase.config.similarityThreshold || DEFAULT_RAG_CONFIG.similarityThreshold,
        maxResults: knowledgeBase.config.maxResults || DEFAULT_RAG_CONFIG.maxResults,
      });
    }
  }, [knowledgeBase]);

  const handleSave = async () => {
    try {
      await updateKnowledgeBase.mutateAsync({
        id: knowledgeBaseId,
        data: {
          config,
        },
      });
      toast.success('配置已保存');
    } catch (error: any) {
      toast.error(`保存失败：${error.response?.data?.message || error.message}`);
    }
  };

  const quotaDisplay = stats
    ? calculateQuotaDisplay(stats.totalSize, 500 * 1024 * 1024)
    : null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/knowledge-bases')}>
            返回
          </Button>
          <h1 className="text-3xl font-bold inline-block">知识库配置</h1>
        </div>
        {knowledgeBase && (
          <p className="text-muted-foreground">
            {knowledgeBase.name}
          </p>
        )}
      </div>

      <div className="grid gap-6">
        {/* Storage Stats */}
        {stats && quotaDisplay && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                存储统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">文档数</p>
                  <p className="text-2xl font-bold">{stats.documentCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">分块数</p>
                  <p className="text-2xl font-bold">{stats.totalChunks}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-sm font-medium">存储使用</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {quotaDisplay.used} / {quotaDisplay.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      quotaDisplay.percentage > 90
                        ? 'bg-red-500'
                        : quotaDisplay.percentage > 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${quotaDisplay.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  已使用 {quotaDisplay.percentage}% | 剩余 {quotaDisplay.remaining}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chunking Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>分块配置</CardTitle>
            <CardDescription>
              控制文档如何被分割成小块用于向量检索
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chunkSize">分块大小 (tokens)</Label>
                <span className="text-sm font-mono">{config.chunkSize}</span>
              </div>
              <Slider
                id="chunkSize"
                value={[config.chunkSize]}
                min={100}
                max={2000}
                step={50}
                onValueChange={([value]) => setConfig({ ...config, chunkSize: value })}
              />
              <p className="text-xs text-muted-foreground">
                较大的分块包含更多上下文，但可能降低检索精度
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chunkOverlap">重叠大小 (tokens)</Label>
                <span className="text-sm font-mono">{config.chunkOverlap}</span>
              </div>
              <Slider
                id="chunkOverlap"
                value={[config.chunkOverlap]}
                min={0}
                max={500}
                step={10}
                onValueChange={([value]) => setConfig({ ...config, chunkOverlap: value })}
              />
              <p className="text-xs text-muted-foreground">
                重叠部分保持上下文连贯性
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>检索配置</CardTitle>
            <CardDescription>
              控制 RAG 检索的行为
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="similarityThreshold">相似度阈值</Label>
                <span className="text-sm font-mono">{config.similarityThreshold.toFixed(2)}</span>
              </div>
              <Slider
                id="similarityThreshold"
                value={[config.similarityThreshold]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) => setConfig({ ...config, similarityThreshold: value })}
              />
              <p className="text-xs text-muted-foreground">
                低于此阈值的结果将被过滤 (0=完全不相关，1=完全相同)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxResults">最大返回数</Label>
                <span className="text-sm font-mono">{config.maxResults}</span>
              </div>
              <Slider
                id="maxResults"
                value={[config.maxResults]}
                min={1}
                max={50}
                step={1}
                onValueChange={([value]) => setConfig({ ...config, maxResults: value })}
              />
              <p className="text-xs text-muted-foreground">
                每次检索返回的最大结果数
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/knowledge-bases')}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={updateKnowledgeBase.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateKnowledgeBase.isPending ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>
    </div>
  );
}
