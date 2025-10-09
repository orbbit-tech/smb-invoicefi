'use server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { BaseSession, Session } from '@/utils/atoms/auth';
import { AUTH_CONFIG } from '@/config/auth-config';

// Mock session for dev mode
const getMockBaseSession = (): BaseSession => ({
  isAuthenticated: true,
  member: {
    id: 'dev-member-123',
  },
  org: {
    id: 'dev-org-456',
    slug: 'dev-org',
  },
  business: {
    id: 'dev-business-789',
  },
  person: {
    id: 'dev-person-101',
  },
});

export const getBaseSession = async (): Promise<BaseSession> => {
  // Dev mode: Return mock session
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true') {
    return getMockBaseSession();
  }

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
    const decoded = jwt.decode(sessionJwt) as {
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
  }
  return session;
};

export const getSession = async (): Promise<Session> => {
  // Dev mode: Return mock session with display data
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true') {
    const baseSession = getMockBaseSession();
    return {
      isAuthenticated: true,
      member: {
        id: baseSession.member.id,
        givenName: 'Dev',
        familyName: 'User',
        name: 'Dev User',
        email: 'dev@example.com',
        phone: null,
      },
      org: {
        id: baseSession.org.id,
        slug: baseSession.org.slug,
        name: 'Dev Organization',
        type: 'BUSINESS_SMB',
        logoUrl: null,
      },
      business: {
        id: baseSession.business.id,
      },
      person: {
        id: baseSession.person.id,
      },
    };
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
