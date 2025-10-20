import { SidebarProvider } from '@ui';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { Metadata } from 'next';
import { SessionInitializer } from '@/components/session-initializer';
import { DashboardContent } from '@/components/(dashboard)/dashboard-content';
import { DashboardHeader } from '@/components/(dashboard)/dashboard-header';

export const metadata: Metadata = {
  title: 'Orbbit Investor Dashboard',
  description: 'Invoice Marketplace for Investors',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get base session (IDs only) from JWT or mock session in dev mode
  const enrichedSession = {
    isAuthenticated: true,
    member: {
      id: '123',
      givenName: 'Sam', // Will be populated in layout
      familyName: null, // Will be populated in layout
      name: 'Sam Phillips', // Will be populated in layout
      email: 'sam@gmail.com', // Will be populated in layout
      phone: '1234567890',
    },
    org: {
      id: '123',
      slug: 'sam',
      name: null, // Will be populated in layout
      type: null, // Will be populated in layout
      logoUrl: null, // Will be populated in layout
    },
    business: {
      id: '123',
    },
    person: {
      id: '123',
    },
  };

  return (
    <div className="h-screen overflow-hidden pt-14">
      {/* Full-width fixed header */}
      <DashboardHeader />

      {/* Main layout with sidebar - h-full automatically accounts for pt-14 */}
      <SidebarProvider className="h-full min-h-0">
        <SessionInitializer initialSession={enrichedSession} />
        <AppSidebar session={enrichedSession} />
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </div>
  );
}
