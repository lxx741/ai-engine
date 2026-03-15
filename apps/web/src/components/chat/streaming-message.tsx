'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { StreamChunkDto } from '@/lib/sse-client';

export interface StreamingMessageProps {
  content: string;
  role?: 'user' | 'assistant' | 'system';
  isStreaming?: boolean;
  className?: string;
}

export function StreamingMessage({
  content,
  role = 'assistant',
  isStreaming = false,
  className,
}: StreamingMessageProps) {
  return (
    <div
      className={cn(
        'flex w-full mb-4',
        role === 'user' ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          role === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {content}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
        </div>
      </div>
    </div>
  );
}

export function useTypewriterEffect(
  chunks: StreamChunkDto[],
  speed: number = 10
): { displayedContent: string; isComplete: boolean } {
  const [displayedContent, setDisplayedContent] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);
  const fullContent = React.useMemo(() => chunks.map((c) => c.content).join(''), [chunks]);

  React.useEffect(() => {
    setDisplayedContent('');
    setIsComplete(false);
  }, [chunks]);

  React.useEffect(() => {
    if (fullContent.length === 0) {
      setIsComplete(true);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullContent.length) {
        setDisplayedContent(fullContent.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [fullContent, speed]);

  return { displayedContent, isComplete };
}
