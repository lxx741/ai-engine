'use client';

import ChatPage from '@/components/chat/chat-window';

interface PageProps {
  params: {
    appId: string;
  };
}

export default function AppChatPage({ params }: PageProps) {
  return <ChatPage appId={params.appId} />;
}
