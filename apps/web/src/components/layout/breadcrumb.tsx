'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    breadcrumbs.push({
      label: '首页',
      href: '/',
    });

    let accumulatedPath = '';
    for (let i = 0; i < paths.length; i++) {
      const segment = paths[i];
      accumulatedPath += `/${segment}`;

      if (segment.match(/^\[.+\]$/)) {
        const parentPath = paths.slice(0, i).join('/');
        const grandParentSegment = paths[i - 2];

        if (grandParentSegment === 'knowledge-bases' && segment.match(/^\[id\]$/)) {
          breadcrumbs.push({
            label: '详情',
            href: accumulatedPath,
          });
        } else if (grandParentSegment === 'knowledge-bases' && paths[i - 1] === 'documents') {
          breadcrumbs.push({
            label: '文档管理',
            href: accumulatedPath,
          });
        } else if (grandParentSegment === 'knowledge-bases' && paths[i - 1] === 'settings') {
          breadcrumbs.push({
            label: '配置',
            href: accumulatedPath,
          });
        } else if (grandParentSegment === 'apps' && segment.match(/^\[id\]$/)) {
          breadcrumbs.push({
            label: '应用详情',
            href: accumulatedPath,
          });
        } else if (grandParentSegment === 'chat' && segment.match(/^\[appId\]$/)) {
          breadcrumbs.push({
            label: '对话',
            href: accumulatedPath,
          });
        } else if (grandParentSegment === 'workflows' && segment.match(/^\[id\]$/)) {
          const nextSegment = paths[i + 1];
          if (nextSegment === 'edit') {
            breadcrumbs.push({
              label: '编辑工作流',
              href: accumulatedPath,
            });
          } else if (nextSegment === 'run') {
            breadcrumbs.push({
              label: '执行工作流',
              href: accumulatedPath,
            });
          } else {
            breadcrumbs.push({
              label: '工作流详情',
              href: accumulatedPath,
            });
          }
        } else if (grandParentSegment === 'tools' && segment.match(/^\[name\]$/)) {
          breadcrumbs.push({
            label: '工具详情',
            href: accumulatedPath,
          });
        }
      } else if (segment === 'new') {
        const parentSegment = paths[i - 1];
        let label = '新建';

        if (parentSegment === 'apps') {
          label = '新建应用';
        } else if (parentSegment === 'workflows') {
          label = '新建工作流';
        } else if (parentSegment === 'tools') {
          label = '新建工具';
        } else if (parentSegment === 'knowledge-bases') {
          label = '新建知识库';
        }

        breadcrumbs.push({
          label,
          href: accumulatedPath,
        });
      } else if (segment === 'edit') {
        breadcrumbs.push({
          label: '编辑',
          href: accumulatedPath,
        });
      } else if (segment === 'run') {
        breadcrumbs.push({
          label: '执行',
          href: accumulatedPath,
        });
      } else if (segment === 'documents') {
        breadcrumbs.push({
          label: '文档管理',
          href: accumulatedPath,
        });
      } else if (segment === 'settings') {
        breadcrumbs.push({
          label: '配置',
          href: accumulatedPath,
        });
      } else if (segment === 'test') {
        breadcrumbs.push({
          label: '测试',
          href: accumulatedPath,
        });
      } else {
        const labelMap: Record<string, string> = {
          apps: '应用管理',
          chat: '对话功能',
          workflows: '工作流管理',
          tools: '工具管理',
          'knowledge-bases': '知识库管理',
        };

        breadcrumbs.push({
          label:
            labelMap[segment] ||
            segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: accumulatedPath,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-slate-400" />}

            {isLast ? (
              <span className="text-foreground font-medium">
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link href={breadcrumb.href} className="hover:text-primary transition-colors">
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
