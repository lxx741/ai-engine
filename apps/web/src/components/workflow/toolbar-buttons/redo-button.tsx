'use client';

import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RedoButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function RedoButton({ onClick, disabled, title }: RedoButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title || '重做 (Ctrl+Shift+Z)'}
    >
      <RotateCw className="w-4 h-4" />
    </Button>
  );
}
