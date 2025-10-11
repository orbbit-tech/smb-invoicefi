'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * NavLogo - Logo component for navigation
 *
 * Displays Orbbit logo linking to home
 */
export function NavLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/orbbit-logo-long.png"
        alt="Orbbit"
        width={102}
        height={32}
        className="rounded-lg"
        priority
      />
    </Link>
  );
}
