'use client';

import * as React from 'react';
import { FileText, Home, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  NavMain,
} from '@ui';

import { NavMember } from './nav-member';
import { NavOrg } from './nav-org';
import { Session } from '@/utils/atoms/auth';
import Link from 'next/link';

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

  const orgDisplayData = {
    name: session.org.name ?? 'Organization',
    logoUrl: session.org.logoUrl ?? '',
  };

  // Build navigation items with active state detection
  const navMain = React.useMemo(() => {
    const items = [
      {
        title: 'Overview',
        url: '/',
        icon: Home,
        isActive: pathname === '/',
      },
      {
        title: 'My Invoices',
        url: '/invoices',
        icon: FileText,
        isActive:
          pathname?.startsWith('/invoices') && pathname !== '/invoices/submit',
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavOrg org={orgDisplayData} />
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
