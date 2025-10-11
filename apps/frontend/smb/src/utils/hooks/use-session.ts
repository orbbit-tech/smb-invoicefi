'use client';

import { useAtomValue } from 'jotai';
import { sessionAtom } from '../atoms/auth';

/**
 * Hook to access the current session data
 * Uses Jotai atom for state management
 */
export function useSession() {
  return useAtomValue(sessionAtom);
}
