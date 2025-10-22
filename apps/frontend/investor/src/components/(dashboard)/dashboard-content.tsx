'use client';

import React from 'react';
import { SidebarInset } from '@ui';
import { useSession } from '@/utils/hooks/use-session';

interface DashboardContentProps {
  children: React.ReactNode;
}

/**
 * DashboardContent - Main layout wrapper for dashboard pages
 *
 * Clean Dashboard Design principles:
 * - Consistent max-width container (max-w-7xl)
 * - Standardized horizontal padding (32px on desktop)
 * - Fixed header that stays visible while scrolling (Coinbase-style)
 */
export function DashboardContent({ children }: DashboardContentProps) {
  const session = useSession();

  const memberDisplayData = {
    name: session.member.name ?? '',
    email: session.member.email ?? '',
  };

  return (
    <SidebarInset>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-8 py-8">{children}</div>
      </div>
    </SidebarInset>
  );
}
