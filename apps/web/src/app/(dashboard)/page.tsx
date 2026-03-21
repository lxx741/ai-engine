import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppWindow, MessageSquare, Workflow, Wrench, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">欢迎使用 AI Engine</h1>
        <p className="text-muted-foreground">企业级 AI 应用开发平台</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Link href="/apps">
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-6 w-6" />
                应用管理
              </CardTitle>
            </Link>
            <CardDescription>创建和管理您的 AI 应用</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/apps/new">
              <Button variant="outline" size="sm" className="w-full">
                新建应用
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Link href="/chat">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                对话功能
              </CardTitle>
            </Link>
            <CardDescription>与应用进行智能对话</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button variant="outline" size="sm" className="w-full">
                开始对话
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Link href="/workflows">
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-6 w-6" />
                工作流管理
              </CardTitle>
            </Link>
            <CardDescription>设计和执行自动化工作流</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/workflows/new">
              <Button variant="outline" size="sm" className="w-full">
                新建工作流
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Link href="/tools">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-6 w-6" />
                工具管理
              </CardTitle>
            </Link>
            <CardDescription>管理和配置各种工具</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="w-full">
                查看工具
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Link href="/knowledge-bases">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                知识库管理
              </CardTitle>
            </Link>
            <CardDescription>管理文档和 RAG 检索配置</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/knowledge-bases">
              <Button variant="outline" size="sm" className="w-full">
                管理知识库
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <a href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                API 文档
              </CardTitle>
            </a>
            <CardDescription>查看 API 接口文档</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="http://localhost:3000/docs" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full">
                查看文档
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
