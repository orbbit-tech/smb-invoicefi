'use client';

import { Avatar, AvatarFallback, AvatarImage, Button } from '../shadcn';
import { Building, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface DiscoveredOrganization {
  organization: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
  };
  member: {
    id: string;
  };
}

export interface ChooseOrganizationProps {
  organizations: DiscoveredOrganization[];
  onContinue: (organizationId: string, memberId: string) => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  heading?: string;
  description?: string;
  continueButtonText?: string;
}

export function ChooseOrganization({
  organizations,
  onContinue,
  isLoading = false,
  isSuccess = false,
  heading = 'Select Organization',
  description = 'Choose an organization to continue',
  continueButtonText = 'Continue',
}: ChooseOrganizationProps) {
  const [selectedStytchOrganizationId, setSelectedStytchOrganizationId] =
    useState<string>('');
  const [selectedStytchMemberId, setSelectedStytchMemberId] =
    useState<string>('');

  // Auto-select first organization when organizations are loaded
  useEffect(() => {
    if (organizations.length > 0 && !selectedStytchOrganizationId) {
      const firstOrg = organizations[0];
      if (firstOrg.organization.id && firstOrg.member.id) {
        setSelectedStytchOrganizationId(firstOrg.organization.id);
        setSelectedStytchMemberId(firstOrg.member.id);
      }
    }
  }, [organizations, selectedStytchOrganizationId]);

  // This function updates the UI to show selection
  const handleSelect = (stytchOrganizationId: string, stytchMemberId: string) => {
    setSelectedStytchOrganizationId(stytchOrganizationId);
    setSelectedStytchMemberId(stytchMemberId);
  };

  // This function handles the actual login when Continue is clicked
  const handleContinue = () => {
    if (!selectedStytchOrganizationId) {
      console.error('No organization selected');
      return;
    }

    onContinue(selectedStytchOrganizationId, selectedStytchMemberId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {organizations.length > 0 && (
          <div className="space-y-3">
            {organizations
              .filter((item) => item.organization.id && item.member.id)
              .map((item) => (
                <div
                  key={item.organization.id}
                  className="rounded-md border p-4 transition-all hover:cursor-pointer hover:shadow-md"
                  onClick={() =>
                    handleSelect(item.organization.id, item.member.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.organization.logoUrl ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={item.organization.logoUrl}
                            alt={item.organization.name}
                          />
                          <AvatarFallback>
                            {item.organization.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                          <Building
                            className="text-muted-foreground h-5 w-5"
                            data-testid="building-icon"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.organization.name}</p>
                        {item.organization.slug && (
                          <p className="text-muted-foreground text-sm">
                            @{item.organization.slug}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedStytchOrganizationId === item.organization.id && (
                      <Check className="text-primary h-5 w-5" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {organizations.length > 0 && (
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
            disabled={!selectedStytchOrganizationId || isLoading || isSuccess}
          >
            {isLoading || isSuccess ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              continueButtonText
            )}
          </Button>
          {isSuccess && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Redirecting to dashboard...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
