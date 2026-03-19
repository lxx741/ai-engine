'use client';

import { useState } from 'react';
import { X, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from './templates';

interface TemplateSelectorProps {
  onSelect: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'all', label: '全部类别' },
  { value: 'customer-service', label: '客服支持' },
  { value: 'content-generation', label: '内容生成' },
  { value: 'data-analysis', label: '数据分析' },
  { value: 'automation', label: '自动化' },
];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApply = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">模板库</h2>
            <p className="text-sm text-muted-foreground mt-1">
              选择预设模板快速创建工作流
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择类别" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>没有找到匹配的模板</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{template.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {CATEGORIES.find((c) => c.value === template.category)?.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {template.nodes.length} 个节点
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{template.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                        {CATEGORIES.find((c) => c.value === template.category)?.label}
                      </span>
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        {template.nodes.length} 个节点
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredTemplates.length} 个模板
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedTemplate}
              className="px-6"
            >
              应用模板
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
