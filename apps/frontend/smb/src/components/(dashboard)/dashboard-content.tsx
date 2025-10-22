'use client';

import React from 'react';
import { SidebarInset } from '@ui';

interface DashboardContentProps {
  children: React.ReactNode;
}

/**
 * DashboardContent - Main layout wrapper for dashboard pages
 *
 * Clean Dashboard Design principles:
 * - Consistent max-width container (max-w-7xl)
 * - Standardized horizontal padding (32px on desktop)
 * - Fixed header that stays visible while scrolling
 */
export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <SidebarInset>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6 sm:p-8 md:p-12">
          {children}
        </div>
      </div>
    </SidebarInset>
  );
}
