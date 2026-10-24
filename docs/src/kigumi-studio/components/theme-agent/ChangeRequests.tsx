import clsx from 'clsx';
import { Button, ButtonGroup, Callout, Icon } from '@/components/ui';
import { PROPERTIES_BY_VAR } from '../../lib/property-definitions';
import {
  changeRequestLabel,
  OPEN_REQUEST_CLASS,
} from '../../theme-agent/change-request-label';
import type {
  ChangeRequest,
  ChangeRequestStatus,
} from '../../theme-agent/conversation';

const RESOLVED_TEXT: Record<Exclude<ChangeRequestStatus, 'open'>, string> = {
  kept: 'Kept. Name it in a message to change it after all.',
  overwritten: 'Overwritten',
  undone: 'Undone',
};

function displayValue(request: ChangeRequest, which: 'current' | 'proposed') {
  if (request.kind === 'shadowComponents') {
    const list = request[which];
    return list.length > 0 ? list.join(', ') : 'none';
  }
  const unit = PROPERTIES_BY_VAR.get(request.cssVar)?.unit ?? '';
  return `${request[which]}${unit}`;
}

interface ChangeRequestsProps {
  requests: ChangeRequest[];
  onKeep: (request: ChangeRequest) => void;
  onOverwrite: (request: ChangeRequest) => void;
  onKeepAll: () => void;
  onOverwriteAll: () => void;
}

/**
 * The hand-set values an answer would change, each with the agent's reason
 * and keep or overwrite; "all" variants from two open requests on.
 */
export function ChangeRequests({
  requests,
  onKeep,
  onOverwrite,
  onKeepAll,
  onOverwriteAll,
}: ChangeRequestsProps) {
  const open = requests.filter((request) => request.status === 'open');
  return (
    <Callout variant="brand" size="small" className="theme-agent__outcome">
      <Icon slot="icon" name="hand" />
      <div className="wa-stack wa-gap-s">
        <span>
          {requests.length === 1
            ? 'The Theme Agent would change a value you set by hand:'
            : 'The Theme Agent would change values you set by hand:'}
        </span>
        {requests.map((request) => {
          const label = changeRequestLabel(request);
          return (
            <div
              key={request.id}
              className={clsx(
                'theme-agent__request wa-stack wa-gap-2xs',
                request.status === 'open' && OPEN_REQUEST_CLASS
              )}
            >
              <span className="theme-agent__request-target">{label}</span>
              <span className="theme-agent__request-change">
                {displayValue(request, 'current')} →{' '}
                {displayValue(request, 'proposed')}
              </span>
              {request.reason && (
                <span className="theme-agent__request-reason">
                  {request.reason}
                </span>
              )}
              {request.status === 'open' ? (
                <ButtonGroup label={label}>
                  <Button
                    size="small"
                    appearance="outlined"
                    onClick={() => onKeep(request)}
                  >
                    Keep
                  </Button>
                  <Button
                    size="small"
                    appearance="outlined"
                    onClick={() => onOverwrite(request)}
                  >
                    Overwrite
                  </Button>
                </ButtonGroup>
              ) : (
                <span className="theme-agent__outcome-text">
                  {RESOLVED_TEXT[request.status]}
                </span>
              )}
            </div>
          );
        })}
        {open.length >= 2 && (
          <ButtonGroup label="All change requests">
            <Button size="small" appearance="outlined" onClick={onKeepAll}>
              Keep all
            </Button>
            <Button size="small" appearance="outlined" onClick={onOverwriteAll}>
              Overwrite all
            </Button>
          </ButtonGroup>
        )}
      </div>
    </Callout>
  );
}
