'use client';

import { useAtom } from 'jotai';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  emailAtom,
  authStepAtom,
  AuthStep,
  intermediateSessionTokenAtom,
  discoveredOrganizationsAtom,
  sessionAtom,
  DiscoveredOrganization,
} from '@/utils/atoms/auth';
import { useRouter } from 'next/navigation';

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000';

// ============================================================================
// Type Definitions (matching backend DTOs)
// ============================================================================

interface SendEmailOtpParams {
  email: string;
}

interface AuthenticateEmailOtpParams {
  email: string;
  code: string;
}

interface AuthenticateEmailOtpResult {
  intermediateSessionToken: string;
  discoveredOrganizations: DiscoveredOrganization[];
}

interface CompleteSignupParams {
  intermediateSessionToken: string;
  organizationName: string;
  givenName: string;
  familyName: string;
}

interface CompleteSignupResult {
  organizationId: string;
}

interface ExchangeIntermediateSessionParams {
  intermediateSessionToken: string;
  organizationId: string;
}

interface ExchangeIntermediateSessionResult {
  organizationId: string;
}

// ============================================================================
// Auth Manager Hook
// ============================================================================

export function useAuthManager() {
  const router = useRouter();

  const [email, setEmail] = useAtom(emailAtom);
  const [authStep, setAuthStep] = useAtom(authStepAtom);
  const [session, setSession] = useAtom(sessionAtom);
  const [intermediateSessionToken, setIntermediateSessionToken] = useAtom(
    intermediateSessionTokenAtom
  );
  const [discoveredOrganizations, setDiscoveredOrganizations] = useAtom(
    discoveredOrganizationsAtom
  );

  // ============================================================================
  // Send Email OTP Mutation
  // ============================================================================

  const sendDiscoveryEmailOtp = useMutation({
    mutationFn: async (params: SendEmailOtpParams) => {
      setEmail(params.email);

      const response = await fetch(`${API_BASE_URL}/auth/email/otp/send`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Failed to send OTP' }));
        throw new Error(error.message || 'Failed to send OTP');
      }

      return;
    },
    onSuccess: () => {
      setAuthStep(AuthStep.Otp);
      toast.success('Verification code sent to your email');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send verification code');
    },
  });

  // ============================================================================
  // Authenticate Email OTP Mutation
  // ============================================================================

  const authenticateDiscoveryEmailOtp = useMutation({
    mutationFn: async (
      params: AuthenticateEmailOtpParams
    ): Promise<AuthenticateEmailOtpResult> => {
      const response = await fetch(
        `${API_BASE_URL}/auth/email/otp/authenticate`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Invalid verification code' }));
        throw new Error(error.message || 'Invalid verification code');
      }

      return await response.json();
    },
    onSuccess: (result) => {
      const organizations = result.discoveredOrganizations || [];
      setDiscoveredOrganizations(organizations);
      setIntermediateSessionToken(result.intermediateSessionToken);

      // If no organizations found, go to create organization step
      // Otherwise, go to choose organization step
      if (organizations.length === 0) {
        setAuthStep(AuthStep.CreateOrganization);
      } else {
        setAuthStep(AuthStep.ChooseOrganization);
      }

      toast.success('Code verified successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid verification code');
    },
  });

  // ============================================================================
  // Exchange Intermediate Session Token Mutation
  // ============================================================================

  const exchangeIntermediateSessionToken = useMutation({
    mutationFn: async (
      params: ExchangeIntermediateSessionParams
    ): Promise<ExchangeIntermediateSessionResult> => {
      const response = await fetch(
        `${API_BASE_URL}/auth/intermediate-sessions/exchange`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Failed to join organization' }));
        throw new Error(error.message || 'Failed to join organization');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Session JWT is now stored in HTTP-only cookie by backend
      // Update session state to mark as authenticated
      setSession({
        ...session,
        isAuthenticated: true,
        org: {
          ...session.org,
          id: data.organizationId,
        },
      });

      toast.success('Signed in successfully');
      router.push('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign in');
    },
  });

  // ============================================================================
  // Complete Signup Mutation
  // ============================================================================

  const completeSignup = useMutation({
    mutationFn: async (
      params: CompleteSignupParams
    ): Promise<CompleteSignupResult> => {
      const response = await fetch(`${API_BASE_URL}/auth/complete-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Failed to create organization' }));
        throw new Error(error.message || 'Failed to create organization');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Session JWT is now stored in HTTP-only cookie by backend
      // Update session state to mark as authenticated
      setSession({
        ...session,
        isAuthenticated: true,
        org: {
          ...session.org,
          id: data.organizationId,
        },
      });

      toast.success('Organization created successfully!');
      router.push('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });

  // ============================================================================
  // Logout Mutation
  // ============================================================================

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      return;
    },
    onSuccess: () => {
      // Clear all auth state
      setEmail('');
      setAuthStep(AuthStep.Email);
      setSession({
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
      setIntermediateSessionToken(null);
      setDiscoveredOrganizations([]);

      toast.success('Logged out successfully');
      router.push('/auth');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to logout');
      // Even if logout fails on backend, clear local state
      router.push('/auth');
    },
  });

  return {
    sendDiscoveryEmailOtp,
    authenticateDiscoveryEmailOtp,
    exchangeIntermediateSessionToken,
    completeSignup,
    logout,
    email,
    setEmail,
    authStep,
    setAuthStep,
    AuthStep,
    discoveredOrganizations,
    setDiscoveredOrganizations,
    intermediateSessionToken,
    setIntermediateSessionToken,
    session,
    setSession,
  };
}
