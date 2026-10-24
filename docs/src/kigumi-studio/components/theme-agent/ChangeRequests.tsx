import { useEffect, useRef } from 'react';
import {
  Button,
  ButtonGroup,
  Callout,
  Icon,
  type ButtonRef,
} from '@/components/ui';
import type {
  ChangeRequest,
  ChangeRequestStatus,
} from '../../theme-agent/conversation';
import { describeChangeRequest } from '../../theme-agent/describe-change-request';

const RESOLVED_TEXT: Record<Exclude<ChangeRequestStatus, 'open'>, string> = {
  kept: 'Kept. Name it in a message to change it after all.',
  overwritten: 'Overwritten',
  undone: 'Undone',
};

// A value the user changed while the answer was being written was not
// hand-set when the agent proposed it, so it gave no reason.
const NO_REASON =
  'The Theme Agent gave no reason for this value; its answer above explains the change.';

/** The id of a request's reason, shared by the callout and its buttons. */
function reasonId(request: ChangeRequest): string {
  return `theme-agent-reason-${request.id.replace(/[^\w-]/g, '_')}`;
}

/**
 * What an answer would change among the values set by hand, each with the
 * agent's reason. Information only: the question sits below the callouts,
 * in `ChangeRequestActions`, like the answer's Undo.
 */
export function ChangeRequestsCallout({
  requests,
}: {
  requests: ChangeRequest[];
}) {
  return (
    <Callout variant="brand" size="small">
      <Icon slot="icon" name="hand" />
      <div className="wa-stack wa-gap-s">
        <span>
          {requests.length === 1
            ? 'The Theme Agent would change a value you set by hand:'
            : 'The Theme Agent would change values you set by hand:'}
        </span>
        {requests.map((request) => {
          const { label, current, proposed } = describeChangeRequest(request);
          return (
            <div
              key={request.id}
              className="theme-agent__request wa-stack wa-gap-2xs"
            >
              <span className="theme-agent__request-target">{label}</span>
              <span className="theme-agent__request-change">
                {current} → {proposed}
              </span>
              <span
                id={reasonId(request)}
                className="theme-agent__request-reason"
              >
                {request.reason ?? NO_REASON}
              </span>
              {request.status !== 'open' && (
                <span className="theme-agent__outcome-text">
                  {RESOLVED_TEXT[request.status]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Callout>
  );
}

interface ChangeRequestActionsProps {
  requests: ChangeRequest[];
  onKeep: (request: ChangeRequest) => void;
  onOverwrite: (request: ChangeRequest) => void;
  onKeepAll: () => void;
  onOverwriteAll: () => void;
  /** Called after the last open request is resolved, to move focus on. */
  onAllResolved: () => void;
}

/**
 * Keep or overwrite, one row per open change request, and "all" from two
 * open requests on. After a request is resolved, focus moves to the next
 * open one.
 */
export function ChangeRequestActions({
  requests,
  onKeep,
  onOverwrite,
  onKeepAll,
  onOverwriteAll,
  onAllResolved,
}: ChangeRequestActionsProps) {
  const keepButtons = useRef(new Map<string, ButtonRef>());
  // Set by a click; the buttons it came from are gone after the re-render
  // the click causes, so focus moves on once that render has committed.
  const moveFocus = useRef(false);
  const open = requests.filter((request) => request.status === 'open');

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const next = open[0];
    if (next) keepButtons.current.get(next.id)?.focus({ preventScroll: true });
    else onAllResolved();
  });

  const resolve = (action: () => void) => () => {
    moveFocus.current = true;
    action();
  };

  if (open.length === 0) return null;
  return (
    <div className="wa-stack wa-gap-xs">
      {open.map((request) => {
        const { label, current, proposed } = describeChangeRequest(request);
        return (
          <div
            key={request.id}
            className="wa-cluster wa-gap-xs wa-align-items-center"
          >
            <span className="theme-agent__outcome-text">
              Keep or overwrite {label}?
            </span>
            <ButtonGroup
              label={`${label}: ${current} to ${proposed}`}
              aria-describedby={reasonId(request)}
            >
              <Button
                ref={(button) => {
                  if (button) keepButtons.current.set(request.id, button);
                  else keepButtons.current.delete(request.id);
                }}
                size="small"
                appearance="outlined"
                onClick={resolve(() => onKeep(request))}
              >
                Keep
              </Button>
              <Button
                size="small"
                appearance="outlined"
                onClick={resolve(() => onOverwrite(request))}
              >
                Overwrite
              </Button>
            </ButtonGroup>
          </div>
        );
      })}
      {open.length >= 2 && (
        <div className="wa-cluster wa-gap-xs wa-align-items-center">
          <span className="theme-agent__outcome-text">
            All {open.length} values:
          </span>
          <ButtonGroup label="All change requests">
            <Button
              size="small"
              appearance="outlined"
              onClick={resolve(onKeepAll)}
            >
              Keep all
            </Button>
            <Button
              size="small"
              appearance="outlined"
              onClick={resolve(onOverwriteAll)}
            >
              Overwrite all
            </Button>
          </ButtonGroup>
        </div>
      )}
    </div>
  );
}
