'use client';

import * as React from 'react';
import {
  FileText,
  PlusCircle,
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
  NavMain,
  Button,
  useSidebar,
} from '@ui';

import { Session } from '@/utils/atoms/auth';

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session;
}) {
  const pathname = usePathname();

  const orgDisplayData = {
    name: session.org.name ?? 'Organization',
    logoUrl: session.org.logoUrl ?? '',
  };

  // Build navigation items with active state detection
  const navMain = React.useMemo(() => {
    const items = [
      {
        title: 'My Invoices',
        url: '/',
        icon: FileText,
        isActive:
          pathname === '/' ||
          (pathname?.startsWith('/invoices') && pathname !== '/invoices/submit'),
      },
      {
        title: 'Submit Invoice',
        url: '/invoices/submit',
        icon: PlusCircle,
        isActive: pathname === '/invoices/submit',
      },
    ];

    return items;
  }, [pathname]);

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
