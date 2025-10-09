'use client';

import React from 'react';
import {
  SidebarInset,
  SidebarTrigger,
} from '@ui';

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <SidebarInset className="flex h-full flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-14 shrink-0 items-center backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </div>
      </header>
      <div className="bg-background flex flex-1 flex-col overflow-y-auto pb-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </SidebarInset>
  );
}
