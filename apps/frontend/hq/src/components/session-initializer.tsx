'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { sessionAtom, Session } from '@/utils/atoms/auth';

interface SessionInitializerProps {
  initialSession: Session;
}

/**
 * SessionInitializer - Initializes the session atom with server data
 *
 * This component runs on the client and sets the Jotai session atom
 * with the session data passed from the server
 */
export function SessionInitializer({
  initialSession,
}: SessionInitializerProps) {
  const setSession = useSetAtom(sessionAtom);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession, setSession]);

  return null;
}
