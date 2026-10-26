import { Button, Callout, Details, Icon } from '@/components/ui';
import { violationPair } from '../../theme-agent/contrast';
import type {
  HeldChange,
  HeldEntry,
  HeldReason,
} from '../../theme-agent/conversation';
import { lineDiff } from '../../theme-agent/css-diff';
import { heldChangeLabel } from '../../theme-agent/describe-held-change';

interface UnlockAndApplyProps {
  entries: HeldEntry[];
  /** Unlock and apply the entry at `index`, or every held one without it. */
  onApply: (index?: number) => void;
}

/**
 * A held change's name; while it is held, with the contrast pairs applying
 * it would fix: "Text Quiet (light), fixes Light mode, quiet text on the
 * raised surface".
 */
function entryLabel(entry: HeldEntry): string {
  const label = heldChangeLabel(entry.change);
  if (entry.state !== 'held' || entry.resolves.length === 0) return label;
  return `${label}, fixes ${entry.resolves.map(violationPair).join('; ')}`;
}

/**
 * Studio's report under the answer on its held changes: a success callout
 * for the ones applied with "Unlock and apply" or "Apply", and the values it
 * did not change because they are locked or because the user changed them
 * while it was being written.
 */
export function LockedChangesCallouts({ entries }: { entries: HeldEntry[] }) {
  const labels = (state: (entry: HeldEntry) => boolean) =>
    entries.filter(state).map(entryLabel).join('; ');
  const withReason =
    (reason: HeldReason, applied: boolean) => (entry: HeldEntry) =>
      entry.change.reason === reason && (entry.state === 'applied') === applied;
  const unlocked = labels(withReason('locked', true));
  const applied = labels(withReason('edited', true));
  const locked = labels(withReason('locked', false));
  const edited = labels(withReason('edited', false));
  return (
    <>
      {unlocked && (
        <Callout variant="success" size="small">
          <Icon slot="icon" name="lock-open" />
          Unlocked and applied: {unlocked}.
        </Callout>
      )}
      {applied && (
        <Callout variant="success" size="small">
          <Icon slot="icon" name="check" />
          Applied: {applied}.
        </Callout>
      )}
      {locked && (
        <Callout variant="neutral" size="small">
          <Icon slot="icon" name="lock" />
          Locked, not changed: {locked}.
        </Callout>
      )}
      {edited && (
        <Callout variant="neutral" size="small">
          <Icon slot="icon" name="pencil" />
          You changed these while the answer was written, so they were not
          changed: {edited}.
        </Callout>
      )}
    </>
  );
}

/** "Unlock and apply" for a locked value, "Apply" for one the user edited. */
function applyLabel(entry: HeldEntry) {
  return entry.change.reason === 'locked'
    ? { icon: 'lock-open', text: 'Unlock and apply' }
    : { icon: 'check', text: 'Apply' };
}

/**
 * What a held custom CSS change would do, line by line: the custom CSS is
 * replaced whole, so the diff shows what goes and what comes. Removed and
 * added lines say so in text too, not by colour alone.
 */
function CustomCSSDiff({
  change,
}: {
  change: Extract<HeldChange, { kind: 'customCSS' }>;
}) {
  return (
    <Details summary="Custom CSS changes" className="theme-agent__diff">
      <pre className="theme-agent__diff-lines">
        {lineDiff(change.was, change.proposed).map((line, i) =>
          line.kind === 'removed' ? (
            <del key={i}>
              <span className="wa-visually-hidden">Removed: </span>
              {`- ${line.text}`}
            </del>
          ) : line.kind === 'added' ? (
            <ins key={i}>
              <span className="wa-visually-hidden">Added: </span>
              {`+ ${line.text}`}
            </ins>
          ) : (
            <span key={i}>{`  ${line.text}`}</span>
          )
        )}
      </pre>
    </Details>
  );
}

/** The diff of a held custom CSS change, if `entries` holds one. */
function HeldCustomCSS({ entries }: { entries: HeldEntry[] }) {
  const change = entries.find(
    (entry) => entry.state === 'held' && entry.change.kind === 'customCSS'
  )?.change;
  return change?.kind === 'customCSS' ? (
    <CustomCSSDiff change={change} />
  ) : null;
}

/**
 * The answer's own action, inside its card: the message says what it
 * proposes, so the button needs no copy around it. One held value has one
 * button; two or more add one button per value, named by it, and one for
 * all. A locked value's button unlocks it too. A held custom CSS change
 * shows its diff above the buttons. Nothing once no change is held.
 */
export function UnlockAndApply({ entries, onApply }: UnlockAndApplyProps) {
  const open = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.state === 'held');
  if (open.length === 0) return null;

  if (open.length === 1) {
    const [{ entry, index }] = open;
    const { icon, text } = applyLabel(entry);
    return (
      <>
        <HeldCustomCSS entries={entries} />
        <div className="theme-agent__actions wa-cluster">
          <Button
            size="small"
            appearance="outlined"
            onClick={() => onApply(index)}
          >
            <Icon slot="start" name={icon} />
            {text}
            <span className="wa-visually-hidden">
              : {heldChangeLabel(entry.change)}
            </span>
          </Button>
        </div>
      </>
    );
  }

  const anyLocked = open.some(({ entry }) => entry.change.reason === 'locked');
  return (
    <>
      <HeldCustomCSS entries={entries} />
      <div className="theme-agent__actions wa-cluster wa-gap-xs">
        <Button size="small" appearance="outlined" onClick={() => onApply()}>
          <Icon slot="start" name={anyLocked ? 'lock-open' : 'check'} />
          {anyLocked ? 'Unlock and apply all' : 'Apply all'}
        </Button>
        {open.map(({ entry, index }) => {
          const { icon, text } = applyLabel(entry);
          return (
            <Button
              key={index}
              size="small"
              appearance="plain"
              onClick={() => onApply(index)}
            >
              <Icon slot="start" name={icon} />
              <span className="wa-visually-hidden">{text} </span>
              {heldChangeLabel(entry.change)}
            </Button>
          );
        })}
      </div>
    </>
  );
}
