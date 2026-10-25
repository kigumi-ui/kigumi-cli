import { useState } from 'react';
import { Switch } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import { hasThemeAgentAccess } from '../../theme-agent/access';
import './LockSwitch.css';

interface LockSwitchProps {
  /** The lock key this switch locks and unlocks (lib/locks.ts). */
  lockKey: string;
  /** What it locks, for screen readers, e.g. "Brand Color". */
  context: string;
}

/**
 * "Lock value": keeps one value from the Theme Agent. Only there with the
 * Theme Agent's access cookie, since locks mean nothing to anyone else.
 */
export function LockSwitch({ lockKey, context }: LockSwitchProps) {
  const [available] = useState(() => hasThemeAgentAccess(document.cookie));
  const { lockedValues, setLocked } = useStudio();
  if (!available) return null;

  return (
    <Switch
      size="small"
      checked={lockedValues.includes(lockKey)}
      className="lock-switch"
      onChange={(event) =>
        setLocked([lockKey], (event.target as HTMLInputElement).checked)
      }
    >
      <span className="lock-switch__label">
        <span className="wa-visually-hidden">{context}: </span>
        Lock value
      </span>
    </Switch>
  );
}
