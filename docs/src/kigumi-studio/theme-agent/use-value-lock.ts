import { useCallback, useState } from 'react';
import { useStudio } from '../contexts/StudioContext';
import { hasThemeAgentAccess } from './access';

/**
 * Whether one value is locked against the Theme Agent, and how to change
 * that. Only with the access cookie: without it there is no switch to unlock
 * with, so a stored lock must not leave a value disabled.
 */
export function useValueLock(lockKey: string) {
  const [available] = useState(() => hasThemeAgentAccess(document.cookie));
  const { lockedValues, setLocked } = useStudio();
  const setValueLocked = useCallback(
    (locked: boolean) => setLocked([lockKey], locked),
    [lockKey, setLocked]
  );
  return {
    available,
    locked: available && lockedValues.includes(lockKey),
    setLocked: setValueLocked,
  };
}
