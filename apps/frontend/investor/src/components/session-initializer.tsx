'use client';

import { useAtom } from 'jotai';
import { Session, sessionAtom } from '@/utils/atoms/auth';
import { useEffect } from 'react';

export function SessionInitializer({
  initialSession,
}: {
  initialSession: Session;
}) {
  const [, setSession] = useAtom(sessionAtom);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession, setSession]);

  return null;
}
