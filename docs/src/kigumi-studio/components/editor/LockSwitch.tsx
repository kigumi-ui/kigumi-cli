import { Switch } from '@/components/ui';
import type { ValueLock } from '../../theme-agent/use-value-lock';
import './LockSwitch.css';

interface LockSwitchProps {
  lock: ValueLock;
  /** What it locks, for screen readers, e.g. "Brand Color". */
  context: string;
  /** The visible label, when "Lock value" does not fit what it locks. */
  label?: string;
}

/**
 * "Lock value": keeps one value from the Theme Agent; its control is
 * disabled while locked. A value set per mode locks in the edited mode, and
 * the label says which. Only there with the Theme Agent's access cookie,
 * since locks mean nothing to anyone else.
 */
export function LockSwitch({ lock, context, label }: LockSwitchProps) {
  if (!lock.available) return null;
  const text =
    label ??
    (lock.modes.length === 1 ? `Lock ${lock.modes[0]} value` : 'Lock value');

  return (
    <Switch
      size="small"
      checked={lock.locked}
      className="lock-switch"
      onChange={(event) =>
        lock.setLocked((event.target as HTMLInputElement).checked)
      }
    >
      <span className="lock-switch__label">
        <span className="wa-visually-hidden">{context}: </span>
        {text}
      </span>
    </Switch>
  );
}
