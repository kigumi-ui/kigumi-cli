import { Button, Callout, Icon } from '@/components/ui';
import type { HeldEntry, HeldState } from '../../theme-agent/conversation';
import { heldChangeLabel } from '../../theme-agent/describe-held-change';

/** An answer's held changes and how to apply them. */
export interface HeldView {
  entries: HeldEntry[];
  /** Unlock and apply the entry at `index`, or every held one without it. */
  onApply: (index?: number) => void;
}

/**
 * What an answer did not change because it is locked. Information only: the
 * actions sit below the callouts, in `LockedChangeActions`, like Undo.
 */
export function LockedChangesCallout({ entries }: { entries: HeldEntry[] }) {
  return (
    <Callout variant="neutral" size="small">
      <Icon slot="icon" name="lock" />
      Locked, not changed:{' '}
      {entries.map((entry) => heldChangeLabel(entry.change)).join(', ')}.
    </Callout>
  );
}

const STATE_TEXT: Record<Exclude<HeldState, 'held'>, string> = {
  applied: 'unlocked and applied',
  changed: 'not applied, you changed it since',
  kept: 'kept locked',
};

/**
 * One row per held value: "Unlock and apply" while it is held, else what
 * became of it. With two or more still held, "Unlock and apply all" too.
 */
export function LockedChangeActions({ entries, onApply }: HeldView) {
  const open = entries.filter((entry) => entry.state === 'held').length;
  return (
    <div className="wa-stack wa-gap-xs">
      {open > 0 && (
        <span className="theme-agent__outcome-text">Change anyway?</span>
      )}
      {entries.map((entry, index) => {
        const label = heldChangeLabel(entry.change);
        if (entry.state !== 'held') {
          return (
            <span key={index} className="theme-agent__outcome-text">
              {label}: {STATE_TEXT[entry.state]}
            </span>
          );
        }
        return (
          <div
            key={index}
            className="wa-cluster wa-gap-xs wa-align-items-center"
          >
            <span className="theme-agent__outcome-text">{label}</span>
            <Button
              size="small"
              appearance="outlined"
              onClick={() => onApply(index)}
            >
              <Icon slot="start" name="lock-open" />
              Unlock and apply
              <span className="wa-visually-hidden">: {label}</span>
            </Button>
          </div>
        );
      })}
      {open >= 2 && (
        <div className="wa-cluster">
          <Button size="small" appearance="outlined" onClick={() => onApply()}>
            <Icon slot="start" name="lock-open" />
            Unlock and apply all {open}
          </Button>
        </div>
      )}
    </div>
  );
}
