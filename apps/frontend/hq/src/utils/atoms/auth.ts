import { atom } from 'jotai';

/**
 * Session type definition
 */
export interface Session {
  isAuthenticated: boolean;
  member: {
    id: string;
    givenName: string | null;
    familyName: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  org: {
    id: string;
    slug: string;
    name: string | null;
    type: string | null;
    logoUrl: string | null;
  };
  business: {
    id: string;
  };
  person: {
    id: string;
  };
}

/**
 * Default session state
 */
const defaultSession: Session = {
  isAuthenticated: false,
  member: {
    id: '',
    givenName: null,
    familyName: null,
    name: null,
    email: null,
    phone: null,
  },
  org: {
    id: '',
    slug: '',
    name: null,
    type: null,
    logoUrl: null,
  },
  business: {
    id: '',
  },
  person: {
    id: '',
  },
};

/**
 * Session atom - stores the current user session
 */
export const sessionAtom = atom<Session>(defaultSession);
