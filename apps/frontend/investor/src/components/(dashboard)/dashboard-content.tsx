'use client';

import React from 'react';
import { SidebarInset } from '@ui';
import dynamic from 'next/dynamic';
import { HeaderUserMenu } from '../navigation/header-user-menu';
import { useSession } from '@/utils/hooks/use-session';

interface DashboardContentProps {
  children: React.ReactNode;
}

// Dynamically import wallet components with no SSR
// This prevents hydration issues and allows graceful fallback when Web3 providers aren't configured
const WalletSection = dynamic(
  () => import('./wallet-section').then((mod) => mod.WalletSection),
  {
    ssr: false,
    loading: () => null,
  }
);

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
