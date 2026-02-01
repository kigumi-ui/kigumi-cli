import { Card } from '@/components/ui/Card/Card';
import { Callout } from '@/components/ui/Callout/Callout';
import { Icon } from '@/components/ui/Icon/Icon';
import { Button } from '@/components/ui/Button/Button';

export function CalloutNotificationsExample() {
  return (
    <Card
      appearance="plain"
      style={{ '--spacing': '0' } as React.CSSProperties}
    >
      <div className="wa-stack wa-gap-s">
        {/* Success Callout */}
        <Callout variant="success" size="small">
          <div className="wa-split:row wa-align-items-center">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon name="user-bounty-hunter" family="duotone" />
              <span>This is the way.</span>
            </div>
            <Button variant="success" size="small" appearance="accent">
              Follow the Creed
            </Button>
          </div>
        </Callout>

        {/* Warning Callout */}
        <Callout variant="warning" size="small">
          <div className="wa-split:row wa-align-items-center">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon name="starfighter-twin-ion-engine" family="duotone" />
              <span>It's a trap!</span>
            </div>
            <Button variant="warning" size="small" appearance="accent">
              Take Evasive Action
            </Button>
          </div>
        </Callout>

        {/* Danger Callout */}
        <Callout variant="danger" size="small">
          <div className="wa-split:row wa-align-items-center">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon name="space-station-moon" family="duotone" />
              <span>That's no moon.</span>
            </div>
            <Button variant="danger" size="small" appearance="accent">
              Turn Around
            </Button>
          </div>
        </Callout>
      </div>
    </Card>
  );
}
