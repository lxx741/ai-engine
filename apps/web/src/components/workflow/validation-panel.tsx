'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ValidationError } from '@/lib/workflow-validation';

interface ValidationPanelProps {
  errors: ValidationError[];
  onClose: () => void;
  onNodeSelect?: (nodeId: string) => void;
}

export function ValidationPanel({ errors, onClose, onNodeSelect }: ValidationPanelProps) {
  const errorCount = errors.filter((e) => e.type === 'error').length;
  const warningCount = errors.filter((e) => e.type === 'warning').length;

  return (
    <div className="fixed right-4 top-20 w-96 bg-white border shadow-lg rounded-lg z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {errorCount === 0 && warningCount === 0 ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <h3 className="font-semibold">验证结果</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="p-3 bg-muted/50 border-b flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">总计:</span>
          <Badge variant="secondary">{errors.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">错误:</span>
          <Badge variant="destructive">{errorCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">警告:</span>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {warningCount}
          </Badge>
        </div>
      </div>

      {/* Error List */}
      {errors.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>工作流验证通过！</p>
          <p className="text-xs mt-1">没有发现任何问题</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  error.type === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {error.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        error.type === 'error' ? 'text-red-800' : 'text-amber-800'
                      }`}
                    >
                      {error.message}
                    </p>
                    {error.nodeId && onNodeSelect && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-1 text-xs"
                        onClick={() => onNodeSelect(error.nodeId!)}
                      >
                        定位到节点
                      </Button>
                    )}
                  </div>
                  {error.type === 'error' && (
                    <Badge variant="destructive" className="text-xs">
                      错误
                    </Badge>
                  )}
                  {error.type === 'warning' && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-amber-100 text-amber-800"
                    >
                      警告
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      {errors.length > 0 && (
        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💡 提示：点击错误可以定位到相关节点
          </p>
        </div>
      )}
    </div>
  );
}
