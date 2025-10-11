'use client';

import * as React from 'react';
import {
  Home,
  PanelLeftClose,
  PanelRightClose,
  Settings,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
  NavMain,
  Button,
} from '@ui';
import { NavLogo } from './nav-logo';
import { Session } from '@/utils/atoms/auth';

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session;
}) {
  const pathname = usePathname();

  // Build navigation items with dynamic active state
  const navMain = React.useMemo(
    () => [
      {
        title: 'Overview',
        url: '/',
        icon: Home,
        isActive: pathname === '/',
      },
    ],
    [pathname]
  );

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="top-14 h-[calc(100vh-3.5rem)]"
      {...props}
    >
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
