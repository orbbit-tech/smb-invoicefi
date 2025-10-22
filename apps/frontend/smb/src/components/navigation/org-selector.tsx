'use client';

import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
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
import { discoveredOrganizationsAtom, sessionAtom } from '@/utils/atoms/auth';

/**
 * OrgSelector - Organization selector dropdown for the header
 *
 * Displays current organization and allows switching between
 * organizations the user is a member of
 */
export function OrgSelector() {
  const [session, setSession] = useAtom(sessionAtom);
  const [discoveredOrgs] = useAtom(discoveredOrganizationsAtom);

  const currentOrg = session.org;

  const handleOrgSwitch = (orgId: string) => {
    // Find the selected organization
    const selectedOrg = discoveredOrgs.find(
      (org) => org.organization_id === orgId
    );

    if (selectedOrg) {
      // Update session with new organization
      setSession((prev) => ({
        ...prev,
        org: {
          id: selectedOrg.organization_id,
          name: selectedOrg.organization_name || null,
          slug: selectedOrg.organization_slug || null,
          type: prev.org.type, // Keep the type for now
          logoUrl: prev.org.logoUrl, // Keep the logo for now
        },
      }));
    }
  };

  const handleCreateOrg = () => {
    // TODO: Navigate to create organization flow
    console.log('Create new organization');
  };

  // If no orgs are discovered yet, show mock data or loading state
  const organizations =
    discoveredOrgs.length > 0
      ? discoveredOrgs
      : [
          {
            organization_id: currentOrg.id || '1',
            organization_name: currentOrg.name || 'Acme LLC',
            organization_slug: currentOrg.slug || 'acme-llc',
          },
          {
            organization_id: '2',
            organization_name: 'Tech Startup Inc',
            organization_slug: 'tech-startup',
          },
          {
            organization_id: '3',
            organization_name: 'Consulting Group',
            organization_slug: 'consulting-group',
          },
        ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 h-10 px-0 hover:bg-accent/50 transition-colors border-0"
        >
          <Avatar className="h-8 w-8">
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
          const isActive = org.organization_id === currentOrg.id;
          return (
            <DropdownMenuItem
              key={org.organization_id}
              onClick={() => handleOrgSwitch(org.organization_id)}
              className={`cursor-pointer flex items-center justify-between ${
                isActive ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={isActive ? currentOrg.logoUrl || undefined : undefined}
                    alt={org.organization_name || ''}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {org.organization_name}
                  </span>
                  {org.organization_slug && (
                    <span className="text-xs text-muted-foreground">
                      @{org.organization_slug}
                    </span>
                  )}
                </div>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateOrg} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create new organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
