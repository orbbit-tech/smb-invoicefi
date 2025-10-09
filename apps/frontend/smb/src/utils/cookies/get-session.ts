'use server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { BaseSession, Session } from '@/utils/atoms/auth';
import { AUTH_CONFIG } from '@/config/auth-config';

export const getBaseSession = async (): Promise<BaseSession> => {
  let session: BaseSession = {
    isAuthenticated: false,
    member: {
      id: null,
    },
    org: {
      id: null,
      slug: null,
    },
    business: {
      id: null,
    },
    person: {
      id: null,
    },
  };

  const cookieStore = await cookies();
  const sessionJwt = cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;

  if (sessionJwt) {
    try {
      const decoded = jose.decodeJwt(sessionJwt) as {
        sub?: string; // Stytch member ID
        'https://stytch.com/organization'?: {
          organization_id?: string;
          slug?: string;
        };
        orbbit_member_id?: string;
        orbbit_organization_id?: string;
        orbbit_business_id?: string;
        orbbit_person_id?: string;
      };

      // Extract organization details
      const organization = decoded['https://stytch.com/organization'];

      // Create session info with Orbbit internal IDs
      session = {
        isAuthenticated: true,
        member: {
          id: decoded.orbbit_member_id ?? null,
        },
        org: {
          id: decoded.orbbit_organization_id ?? null,
          slug: organization?.slug ?? null,
        },
        business: {
          id: decoded.orbbit_business_id ?? null,
        },
        person: {
          id: decoded.orbbit_person_id ?? null,
        },
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      // Return unauthenticated session if JWT is invalid
    }
  }
  return session;
};

// Mock session for development when auth is bypassed
const getMockSession = (): Session => {
  return {
    isAuthenticated: true,
    member: {
      id: 'mock-member-id',
      givenName: 'Demo',
      familyName: 'User',
      name: 'Demo User',
      email: 'demo@example.com',
      phone: null,
    },
    org: {
      id: 'mock-org-id',
      slug: 'demo-company',
      name: 'Demo SMB Company',
      type: 'BUSINESS_SMB',
      logoUrl: null,
    },
    business: {
      id: 'mock-business-id',
    },
    person: {
      id: 'mock-person-id',
    },
  };
};

export const getSession = async (): Promise<Session> => {
  // Development mode: return mock session if auth is bypassed
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  if (bypassAuth) {
    console.warn('⚠️  Using mock session - Development only!');
    return getMockSession();
  }

  // Get the base session from JWT (no API calls)
  const baseSession = await getBaseSession();

  // Return session with only JWT-derived data (IDs and auth status)
  // Display data (names, emails) will be fetched in layout component
  return {
    isAuthenticated: baseSession.isAuthenticated,
    member: {
      id: baseSession.member.id,
      givenName: null, // Will be populated in layout
      familyName: null, // Will be populated in layout
      name: null, // Will be populated in layout
      email: null, // Will be populated in layout
      phone: null,
    },
    org: {
      id: baseSession.org.id,
      slug: baseSession.org.slug,
      name: null, // Will be populated in layout
      type: null, // Will be populated in layout
      logoUrl: null, // Will be populated in layout
    },
    business: {
      id: baseSession.business.id,
    },
    person: {
      id: baseSession.person.id,
    },
  };
};
