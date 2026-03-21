'use client';

import { Breadcrumb } from './breadcrumb';
import { useSidebarStore } from '@/store/sidebar-store';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { toggle, isCollapsed } = useSidebarStore();

  return (
    <header className="h-16 border-b border-border bg-background px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={toggle}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <Breadcrumb />
      </div>

      {/* Right side actions (placeholder for user menu, notifications, etc.) */}
      <div className="flex items-center gap-2">
        {/* Reserved for future use: user avatar, notifications, etc. */}
      </div>
    </header>
  );
}
