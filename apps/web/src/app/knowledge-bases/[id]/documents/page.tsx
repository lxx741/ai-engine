'use client';

import { useParams, useRouter } from 'next/navigation';
import { useKnowledgeBase } from '@/hooks/use-knowledge-bases';
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/use-documents';
import { useKnowledgeBaseSearch } from '@/hooks/use-documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { validateFile, formatBytes } from '@/lib/rag-config';

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.id as string;

  const { data: knowledgeBase } = useKnowledgeBase(knowledgeBaseId);
  const { data: documents, isLoading } = useDocuments(knowledgeBaseId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const search = useKnowledgeBaseSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || '文件验证失败');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        knowledgeBaseId,
        file,
        name: file.name,
      });
      toast.success('文档上传成功，正在处理...');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(`上传失败：${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`确定要删除文档 "${documentName}" 吗？`)) {
      return;
    }

    try {
      await deleteDocument.mutateAsync({ knowledgeBaseId, documentId });
      toast.success('文档已删除');
    } catch (error: any) {
      toast.error(`删除失败：${error.response?.data?.message || error.message}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await search.mutateAsync({
        knowledgeBaseId,
        query: searchQuery,
        topK: 10,
        threshold: 0.3,
      });
      setSearchResults(results);
      toast.success(`找到 ${results.length} 个相关结果`);
    } catch (error: any) {
      toast.error(`搜索失败：${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/knowledge-bases')}>
                返回
              </Button>
              <h1 className="text-3xl font-bold inline-block">文档管理</h1>
            </div>
            {knowledgeBase && (
              <p className="text-muted-foreground">
                知识库：{knowledgeBase.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>上传文档</CardTitle>
            <CardDescription>
              支持格式：TXT, JSON, CSV, PDF, DOCX | 单文件最大 10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,.csv,.pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadDocument.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadDocument.isPending ? '上传中...' : '选择文件'}
              </Button>
              {uploadDocument.isPending && (
                <p className="text-sm text-muted-foreground">正在上传...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              RAG 搜索测试
            </CardTitle>
            <CardDescription>测试知识库的向量检索功能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入搜索查询..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={search.isPending}>
                搜索
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">搜索结果 ({searchResults.length})</h4>
                {searchResults.map((result: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{result.content}</p>
                          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                            <span>来源：{result.document.name}</span>
                            <span>相似度：{(result.score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{result.document.fileType}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              文档列表
            </CardTitle>
            <CardDescription>
              已上传的文档及其处理状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">加载中...</p>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {doc.fileType}
                          </Badge>
                          <span>{formatBytes(doc.fileSize)}</span>
                          <span>{doc.chunkCount} 个分块</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          doc.status === 'completed'
                            ? 'default'
                            : doc.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {getStatusText(doc.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id, doc.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无文档</p>
                <p className="text-sm">上传第一个文档开始构建知识库</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
