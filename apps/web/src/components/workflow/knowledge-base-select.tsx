'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllKnowledgeBases } from '@/hooks/use-knowledge-bases';

interface KnowledgeBaseSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function KnowledgeBaseSelect({
  value,
  onChange,
  placeholder = '选择知识库...',
}: KnowledgeBaseSelectProps) {
  const { data: knowledgeBases, isLoading } = useAllKnowledgeBases();
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    if (knowledgeBases) {
      // Handle both single object and array
      const kbs = Array.isArray(knowledgeBases) ? knowledgeBases : knowledgeBases ? [knowledgeBases] : [];
      setOptions(kbs);
    }
  }, [knowledgeBases]);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="加载中..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <SelectItem value="none" disabled>
            暂无知识库
          </SelectItem>
        ) : (
          options.map((kb) => (
            <SelectItem key={kb.id} value={kb.id}>
              {kb.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
