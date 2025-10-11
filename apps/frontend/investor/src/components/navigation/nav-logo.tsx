'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SidebarMenuButton } from '@ui';

/**
 * NavLogo - Orbbit branding for sidebar header
 *
 * Displays the Orbbit square logo in the sidebar header
 */
export function NavLogo() {
  return (
    <SidebarMenuButton size="lg" asChild className="hover:bg-accent">
      <Link href="/" className="flex items-center justify-start">
        <Image
          src="/orbbit-logo-square.png"
          alt="Orbbit"
          width={32}
          height={32}
          className="rounded-lg"
          priority
        />
      </Link>
    </SidebarMenuButton>
  );
}
