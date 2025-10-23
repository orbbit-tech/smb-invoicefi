import { atom } from 'jotai';

export enum AuthStep {
  Email = 'email',
  Otp = 'otp',
  ChooseOrganization = 'choose-organization',
  CreateOrganization = 'create-organization',
}

/**
 * Discovered Organization Interface
 * Represents an organization the user belongs to (discovered during OTP auth)
 * Matches the backend API response from /auth/email/otp/authenticate
 */
export interface DiscoveredOrganization {
  organizationId: string | null;  // Our internal org ID (null if org not in our DB yet)
  stytchOrganizationId: string;   // Stytch's org ID (always present)
}

// Basic data atoms
export const emailAtom = atom<string>('');
export const authStepAtom = atom<AuthStep>(AuthStep.Email);
export const intermediateSessionTokenAtom = atom<string | null>(null);
export const discoveredOrganizationsAtom = atom<DiscoveredOrganization[]>([]);

export interface BaseSession {
  isAuthenticated: boolean;
  member: {
    id: string | null;
  };
  org: {
    id: string | null;
    slug: string | null;
  };
  business: {
    id: string | null;
  };
  person: {
    id: string | null;
  };
}

export interface Session {
  isAuthenticated: boolean;
  member: {
    id: string | null;
    givenName: string | null;
    familyName: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  org: {
    id: string | null;
    name: string | null;
    type: string | null;
    logoUrl: string | null;
    slug: string | null;
  };
  business: {
    id: string | null;
  };
  person: {
    id: string | null;
  };
}

export const sessionAtom = atom<Session>({
  isAuthenticated: false,
  member: {
    id: null,
    email: null,
    givenName: null,
    familyName: null,
    name: null,
    phone: null,
  },
  org: {
    id: null,
    slug: null,
    name: null,
    type: null,
    logoUrl: null,
  },
  business: {
    id: null,
  },
  person: {
    id: null,
  },
});
