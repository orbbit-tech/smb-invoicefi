'use client';

import { useAtomValue } from 'jotai';
import { sessionAtom } from '@/utils/atoms/auth';

/**
 * useSession - Hook to access the current session
 *
 * Returns the current session from Jotai state
 */
export function useSession() {
  return useAtomValue(sessionAtom);
}
