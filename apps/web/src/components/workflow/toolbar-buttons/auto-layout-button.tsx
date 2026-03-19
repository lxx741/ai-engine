'use client';

import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoLayoutButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function AutoLayoutButton({ onClick, disabled, title }: AutoLayoutButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title || '自动布局'}
    >
      <LayoutGrid className="w-4 h-4" />
    </Button>
  );
}
