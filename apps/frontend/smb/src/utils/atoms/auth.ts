import { atom } from 'jotai';

export enum AuthStep {
  Email = 'email',
  Otp = 'otp',
  ChooseOrganization = 'choose-organization',
  CreateOrganization = 'create-organization',
}

// Organization membership type (will be populated by API)
export interface OrganizationMembership {
  organization_id: string;
  organization_name?: string;
  organization_slug?: string;
  member_id?: string;
  [key: string]: unknown;
}

// Basic data atoms
export const emailAtom = atom<string>('');
export const authStepAtom = atom<AuthStep>(AuthStep.Email);
export const intermediateSessionTokenAtom = atom<string | null>(null);
export const discoveredOrganizationsAtom = atom<OrganizationMembership[]>([]);

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
