'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidateButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  errorCount?: number;
}

export function ValidateButton({ onClick, disabled, title, errorCount }: ValidateButtonProps) {
  return (
    <Button
      variant={errorCount && errorCount > 0 ? 'destructive' : 'outline'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title || '验证工作流'}
      className="relative"
    >
      <AlertCircle className="w-4 h-4" />
      {errorCount && errorCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {errorCount}
        </span>
      )}
    </Button>
  );
}
