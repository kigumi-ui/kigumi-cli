import { useState } from 'react';
import { Icon, Switch } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import { hasThemeAgentAccess } from '../../theme-agent/access';
import './LockSwitch.css';

interface LockSwitchProps {
  /** The lock keys this switch locks and unlocks (lib/locks.ts). */
  keys: readonly string[];
  /** The visible label, e.g. "Lock value". */
  label: string;
  /** What it locks, for screen readers, e.g. "Brand Color". */
  context?: string;
}

/**
 * Locks values against the Theme Agent: on when every key is locked. Only
 * there with the Theme Agent's access cookie, since locks mean nothing to
 * anyone else.
 */
export function LockSwitch({ keys, label, context }: LockSwitchProps) {
  const [available] = useState(() => hasThemeAgentAccess(document.cookie));
  const { lockedValues, setLocked } = useStudio();
  if (!available || keys.length === 0) return null;

  const locked = keys.every((key) => lockedValues.includes(key));
  return (
    <Switch
      size="small"
      checked={locked}
      className="lock-switch"
      onChange={(event) =>
        setLocked([...keys], (event.target as HTMLInputElement).checked)
      }
    >
      <span className="lock-switch__label">
        <Icon name={locked ? 'lock' : 'lock-open'} />
        {context && <span className="wa-visually-hidden">{context}: </span>}
        {label}
      </span>
    </Switch>
  );
}
