'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  className?: string;
}

export function MessageBubble({ role, content, createdAt, className }: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-4', className)}>
        <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full mb-4', isUser ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</div>
        {createdAt && (
          <div
            className={cn(
              'text-xs mt-2',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatTime(createdAt)}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes} 分钟前`;
  } else if (hours < 24) {
    return `${hours} 小时前`;
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }
}
