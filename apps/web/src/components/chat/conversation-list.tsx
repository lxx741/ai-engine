'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { Conversation } from '@/hooks/use-chat';

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onCreateNew: () => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onCreateNew,
  onDelete,
  className,
}: ConversationListProps) {
  return (
    <div className={cn('flex flex-col h-full bg-muted/30 border-r', className)}>
      <div className="p-4 border-b">
        <Button onClick={onCreateNew} className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          新建对话
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">暂无会话</div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={() => onSelect(conversation)}
                onDelete={onDelete ? () => onDelete(conversation.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  const title = conversation.metadata?.title || `对话 ${conversation.id.slice(0, 8)}...`;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div
          className={cn(
            'text-xs',
            isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {new Date(conversation.createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity',
            isActive
              ? 'hover:bg-primary-foreground/20 hover:text-primary-foreground'
              : 'hover:bg-muted-foreground/20'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
