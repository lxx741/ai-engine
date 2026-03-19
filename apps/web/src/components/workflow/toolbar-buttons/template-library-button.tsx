'use client';

import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateLibraryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function TemplateLibraryButton({ onClick, disabled }: TemplateLibraryButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title="模板库"
    >
      <Book className="w-4 h-4" />
    </Button>
  );
}
