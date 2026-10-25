import { Switch } from '@/components/ui';
import { useValueLock } from '../../theme-agent/use-value-lock';
import './LockSwitch.css';

interface LockSwitchProps {
  /** The lock key this switch locks and unlocks (lib/locks.ts). */
  lockKey: string;
  /** What it locks, for screen readers, e.g. "Brand Color". */
  context: string;
}

/**
 * "Lock value": keeps one value from the Theme Agent; its control is
 * disabled while locked. Only there with the Theme Agent's access cookie,
 * since locks mean nothing to anyone else.
 */
export function LockSwitch({ lockKey, context }: LockSwitchProps) {
  const { available, locked, setLocked } = useValueLock(lockKey);
  if (!available) return null;

  return (
    <Switch
      size="small"
      checked={locked}
      className="lock-switch"
      onChange={(event) =>
        setLocked((event.target as HTMLInputElement).checked)
      }
    >
      <span className="lock-switch__label">
        <span className="wa-visually-hidden">{context}: </span>
        Lock value
      </span>
    </Switch>
  );
}
