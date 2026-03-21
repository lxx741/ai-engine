'use client';

import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { useSidebarStore } from '@/store/sidebar-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {
            const { toggle } = useSidebarStore.getState();
            toggle();
          }}
        />
      )}

      {/* Main content area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          isCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        {/* Header */}
        <AppHeader />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
