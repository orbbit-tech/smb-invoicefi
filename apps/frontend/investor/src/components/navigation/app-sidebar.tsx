'use client';

import * as React from 'react';
import { ShoppingCart, TrendingUp, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  NavMain,
} from '@ui';
import { NavMember } from './nav-member';
// import { NavOrg } from './nav-org'; // Commented out - investors don't need org switching
import { Session } from '@/utils/atoms/auth';

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session;
}) {
  const pathname = usePathname();

  const memberDisplayData = {
    name: session.member.name ?? 'User',
    email: session.member.email ?? '',
  };

  // Commented out - investors don't need org switching
  // const orgDisplayData = {
  //   name: session.org.name ?? 'Organization',
  //   logoUrl: session.org.logoUrl ?? '',
  // };

  // Build navigation items with dynamic active state
  const navMain = React.useMemo(
    () => [
      {
        title: 'Overview',
        url: '/',
        icon: Home,
        isActive: pathname === '/',
      },
      {
        title: 'Marketplace',
        url: '/marketplace',
        icon: ShoppingCart,
        isActive: pathname === '/marketplace',
      },
      {
        title: 'Portfolio',
        url: '/portfolio',
        icon: TrendingUp,
        isActive: pathname === '/portfolio',
      },
    ],
    [pathname]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* <NavOrg org={orgDisplayData} /> */}
            {/* Commented out - investors don't need org switching */}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMember member={memberDisplayData} />
      </SidebarFooter>
    </Sidebar>
  );
}
