import { Home, AppWindow, MessageSquare, Workflow, Wrench, Database, FileText } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  title: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  external?: boolean;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  { title: '首页', icon: Home, path: '/' },
  { title: '应用管理', icon: AppWindow, path: '/apps' },
  { title: '对话功能', icon: MessageSquare, path: '/chat' },
  { title: '工作流管理', icon: Workflow, path: '/workflows' },
  { title: '工具管理', icon: Wrench, path: '/tools' },
  { title: '知识库管理', icon: Database, path: '/knowledge-bases' },
  {
    title: 'API 文档',
    icon: FileText,
    path: 'http://localhost:3000/docs',
    external: true,
  },
];
