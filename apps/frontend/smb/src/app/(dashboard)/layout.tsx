import { SidebarProvider } from '@ui';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { Metadata } from 'next';
import { SessionInitializer } from '@/components/session-initializer';
import { DashboardContent } from '@/components/(dashboard)/dashboard-content';

export const metadata: Metadata = {
  title: 'Orbbit SMB Dashboard',
  description: 'Invoice Financing for SMBs',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
      givenName: 'Test', // Will be populated in layout
      familyName: null, // Will be populated in layout
      name: 'Test User', // Will be populated in layout
      email: 'test@test.com', // Will be populated in layout
      phone: '1234567890',
    },
    org: {
      id: '123',
      slug: 'test',
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
    <SidebarProvider>
      <SessionInitializer initialSession={enrichedSession} />
      <AppSidebar session={enrichedSession} />
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
