'use client';

import * as React from 'react';
import { useChat } from '@/hooks/use-chat';
import { ConversationList } from '@/components/chat/conversation-list';
import { MessageBubble } from '@/components/chat/message-bubble';
import { StreamingMessage } from '@/components/chat/streaming-message';
import { ChatInput } from '@/components/chat/chat-input';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { StreamChunkDto } from '@/lib/sse-client';

interface ChatPageProps {
  appId: string;
}

export default function ChatPage({ appId }: ChatPageProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [streamingChunks, setStreamingChunks] = React.useState<StreamChunkDto[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendStreamMessage,
    stopStreaming,
    isStreaming,
  } = useChat(appId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingChunks]);

  const handleCreateNew = async () => {
    try {
      await createNewConversation();
    } catch (error) {
      toast.error('创建会话失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
      toast.success('已删除会话');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    let conversationId = activeConversation?.id;

    if (!conversationId) {
      try {
        const newConversation = await createNewConversation();
        conversationId = newConversation.id;
      } catch (error) {
        toast.error('创建会话失败');
        return;
      }
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setStreamingChunks([]);

    sendStreamMessage(
      {
        conversationId,
        message: userMessage,
      },
      {
        onChunk: (chunk) => {
          setStreamingChunks((prev) => [...prev, chunk]);
        },
        onDone: () => {
          setStreamingChunks([]);
        },
      }
    );
  };

  const handleStop = () => {
    stopStreaming();
    setStreamingChunks([]);
  };

  const displayedMessages = [...messages];

  if (streamingChunks.length > 0) {
    const streamingContent = streamingChunks.map((c) => c.content).join('');
    displayedMessages.push({
      id: 'streaming',
      role: 'assistant' as const,
      content: streamingContent,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-screen bg-background">
      {isSidebarOpen && (
        <div className="w-80 shrink-0 hidden md:block">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelect={selectConversation}
            onCreateNew={handleCreateNew}
            onDelete={handleDelete}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <ArrowLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <h1 className="text-lg font-semibold">
              {activeConversation?.metadata?.title || '新对话'}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {displayedMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">👋</div>
                <div className="text-lg font-medium">开始对话吧</div>
                <div className="text-sm mt-2">输入消息与 AI 助手进行交流</div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {displayedMessages.map((message) =>
                message.id === 'streaming' ? (
                  <StreamingMessage
                    key={message.id}
                    content={message.content}
                    role={message.role}
                    isStreaming={isStreaming}
                  />
                ) : (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    createdAt={message.createdAt}
                  />
                )
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isLoading={isStreaming}
          disabled={isLoading}
        />

        {isStreaming && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
            <Button variant="outline" size="sm" onClick={handleStop} className="shadow-lg">
              停止生成
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
