'use client';

import { Building2, Check, ChevronDown } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui';
import { useAtom } from 'jotai';
import { sessionAtom } from '@/utils/atoms/auth';

/**
 * OrgSelector - Organization selector dropdown for the header
 *
 * Displays current organization and allows switching between
 * organizations the user is a member of
 */
export function OrgSelector() {
  const [session] = useAtom(sessionAtom);
  const currentOrg = session.org;

  // For demo purposes, only show the current organization
  const organizations = [
    {
      id: currentOrg.id || '123',
      name: currentOrg.name || 'Gallivant Ice Cream',
      slug: currentOrg.slug || 'gallivant-ice-cream',
      logoUrl: currentOrg.logoUrl || 'https://media.cdn.orbbit.co/demo/logos/gallivant-ice-cream-logo.png',
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 h-10 px-0 hover:bg-accent/50 transition-colors border-0"
        >
          <Avatar className="h-8 w-8 bg-neutral-100/90 shadow-sm">
            <AvatarImage
              src={currentOrg.logoUrl || undefined}
              alt={currentOrg.name || ''}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium max-w-[140px] truncate">
            {currentOrg.name || 'Select Organization'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start" forceMount>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Your Organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => {
          const isActive = org.id === currentOrg.id;
          return (
            <DropdownMenuItem
              key={org.id}
              className={`cursor-pointer flex items-center justify-between ${
                isActive ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 bg-neutral-100/90 shadow-sm">
                  <AvatarImage
                    src={org.logoUrl || undefined}
                    alt={org.name || ''}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {org.name}
                  </span>
                  {org.slug && (
                    <span className="text-xs text-muted-foreground">
                      @{org.slug}
                    </span>
                  )}
                </div>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
