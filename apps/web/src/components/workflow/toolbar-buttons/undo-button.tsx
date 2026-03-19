'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UndoButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function UndoButton({ onClick, disabled, title }: UndoButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title || '撤销 (Ctrl+Z)'}
    >
      <RotateCcw className="w-4 h-4" />
    </Button>
  );
}
