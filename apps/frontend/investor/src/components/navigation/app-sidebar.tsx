'use client';

import * as React from 'react';
import {
  ShoppingCart,
  TrendingUp,
  Home,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
  NavMain,
  Button,
} from '@ui';
import { NavMember } from './nav-member';
import { NavLogo } from './nav-logo';
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
        title: 'Portfolio',
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
    ],
    [pathname]
  );

  // Original: <Sidebar collapsible="icon" {...props}>
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="top-14 h-[calc(100vh-3.5rem)]"
      {...props}
    >
      {/* COMMENTED OUT: Logo moved to header */}
      {/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLogo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarCollapseButton />
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * SidebarCollapseButton - Custom collapse/expand button for sidebar footer
 *
 * Shows panel icons to indicate the collapse/expand action
 */
function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hover:cursor-pointer"
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <PanelRightClose className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
}
