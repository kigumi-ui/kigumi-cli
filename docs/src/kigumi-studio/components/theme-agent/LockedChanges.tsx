import { Button, Callout, Icon } from '@/components/ui';
import type { HeldChange } from '../../theme-agent/conversation';
import { heldChangeLabel } from '../../theme-agent/describe-held-change';

/**
 * What an answer did not change because it is locked. Information only: the
 * action sits below the callouts, in `UnlockAndApply`, like the answer's Undo.
 */
export function LockedChangesCallout({ changes }: { changes: HeldChange[] }) {
  return (
    <Callout variant="neutral" size="small">
      <Icon slot="icon" name="lock" />
      Locked, not changed: {changes.map(heldChangeLabel).join(', ')}.
    </Callout>
  );
}

interface UnlockAndApplyProps {
  count: number;
  held: boolean;
  onApply: () => void;
}

/** Unlock the held values and apply what the answer proposed for them. */
export function UnlockAndApply({ count, held, onApply }: UnlockAndApplyProps) {
  if (!held) {
    return (
      <span className="theme-agent__outcome-text">Unlocked and applied</span>
    );
  }
  return (
    <div className="wa-cluster wa-gap-xs wa-align-items-center">
      <span className="theme-agent__outcome-text">
        {count === 1 ? 'Change it anyway?' : `Change all ${count} anyway?`}
      </span>
      <Button size="small" appearance="outlined" onClick={onApply}>
        <Icon slot="start" name="lock-open" />
        Unlock and apply
      </Button>
    </div>
  );
}
