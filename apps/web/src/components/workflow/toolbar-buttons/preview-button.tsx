'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  isRunning?: boolean;
}

export function PreviewButton({ onClick, disabled, title, isRunning }: PreviewButtonProps) {
  return (
    <Button
      variant={isRunning ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      disabled={disabled || isRunning}
      title={title || '执行预览'}
    >
      <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
      {isRunning && <span className="ml-2">运行中...</span>}
    </Button>
  );
}
