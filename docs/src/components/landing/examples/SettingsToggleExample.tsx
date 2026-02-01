import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Icon } from '@/components/ui/Icon/Icon';
import { Switch } from '@/components/ui/Switch/Switch';

export function SettingsToggleExample() {
  const [telemetry, setTelemetry] = useState(true);

  return (
    <Card appearance="outlined">
      <div className="wa-stack wa-gap-s">
        {/* Header with Icon and Switch */}
        <div className="wa-flank:end wa-align-items-center">
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <Icon name="user-robot" />
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              Tell Me the Odds
            </h3>
          </div>
          <Switch
            size="large"
            checked={telemetry}
            onWaChange={(e) =>
              setTelemetry((e.target as HTMLInputElement).checked)
            }
          />
        </div>

        {/* Description */}
        <p
          className="wa-body-s"
          style={{ color: 'var(--wa-color-neutral-60)', margin: 0 }}
        >
          Allow protocol droids to inform you of probabilities, such as the
          success rate of navigating an asteroid field. We recommend setting
          this to "Never."
        </p>
      </div>
    </Card>
  );
}
