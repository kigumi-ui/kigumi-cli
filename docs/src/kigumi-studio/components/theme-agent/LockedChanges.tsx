import { Button, Callout, Icon } from '@/components/ui';
import type { HeldEntry } from '../../theme-agent/conversation';
import { heldChangeLabel } from '../../theme-agent/describe-held-change';

interface UnlockAndApplyProps {
  entries: HeldEntry[];
  /** Unlock and apply the entry at `index`, or every held one without it. */
  onApply: (index?: number) => void;
}

/**
 * Studio's report under the answer on its held changes: a success callout
 * for the ones applied with "Unlock and apply", and the locked values it did
 * not change.
 */
export function LockedChangesCallouts({ entries }: { entries: HeldEntry[] }) {
  const labels = (state: (entry: HeldEntry) => boolean) =>
    entries
      .filter(state)
      .map((entry) => heldChangeLabel(entry.change))
      .join(', ');
  const applied = labels((entry) => entry.state === 'applied');
  const notChanged = labels((entry) => entry.state !== 'applied');
  return (
    <>
      {applied && (
        <Callout variant="success" size="small">
          <Icon slot="icon" name="lock-open" />
          Unlocked and applied: {applied}.
        </Callout>
      )}
      {notChanged && (
        <Callout variant="neutral" size="small">
          <Icon slot="icon" name="lock" />
          Locked, not changed: {notChanged}.
        </Callout>
      )}
    </>
  );
}

/**
 * The answer's own action, inside its card: the message says what it
 * proposes, so the button needs no copy around it. One held value has one
 * "Unlock and apply"; two or more add one button per value, named by it, and
 * "Unlock and apply all". Nothing once no change is held.
 */
export function UnlockAndApply({ entries, onApply }: UnlockAndApplyProps) {
  const open = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.state === 'held');
  if (open.length === 0) return null;

  if (open.length === 1) {
    const [{ entry, index }] = open;
    return (
      <div className="theme-agent__actions wa-cluster">
        <Button
          size="small"
          appearance="outlined"
          onClick={() => onApply(index)}
        >
          <Icon slot="start" name="lock-open" />
          Unlock and apply
          <span className="wa-visually-hidden">
            : {heldChangeLabel(entry.change)}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="theme-agent__actions wa-cluster wa-gap-xs">
      <Button size="small" appearance="outlined" onClick={() => onApply()}>
        <Icon slot="start" name="lock-open" />
        Unlock and apply all
      </Button>
      {open.map(({ entry, index }) => (
        <Button
          key={index}
          size="small"
          appearance="plain"
          onClick={() => onApply(index)}
        >
          <Icon slot="start" name="lock-open" />
          <span className="wa-visually-hidden">Unlock and apply </span>
          {heldChangeLabel(entry.change)}
        </Button>
      ))}
    </div>
  );
}
