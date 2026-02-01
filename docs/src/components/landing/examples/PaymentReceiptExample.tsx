import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Callout } from '@/components/ui/Callout/Callout';
import { Icon } from '@/components/ui/Icon/Icon';
import { Button } from '@/components/ui/Button/Button';
import { Divider } from '@/components/ui/Divider/Divider';
import { FormatDate } from '@/components/ui/FormatDate/FormatDate';

export function PaymentReceiptExample() {
  return (
    <Card appearance="outlined">
      {/* Header with Amount and Badge */}
      <div className="wa-stack wa-gap-s">
        <div className="wa-split:row wa-align-items-center">
          <h2 className="wa-heading-xl" style={{ margin: 0, fontWeight: 700 }}>
            $5,610.00
          </h2>
          <Badge appearance="filled-outlined" variant="success">
            Paid
          </Badge>
        </div>

        {/* Success Callout */}
        <Callout size="small" variant="success" appearance="filled">
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <Icon name="party-horn" />
            <span>You got a sweet Bombadeal!</span>
          </div>
        </Callout>
      </div>

      <Divider />

      {/* Payment Details */}
      <div className="wa-stack wa-gap-xs">
        <div
          className="wa-flank:start wa-align-items-center"
          style={{ '--flank-size': 'auto' } as React.CSSProperties}
        >
          <Icon name="user" style={{ color: 'var(--wa-color-neutral-60)' }} />
          <p
            className="wa-body-s"
            style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
          >
            Tom Bombadil
          </p>
        </div>

        <div
          className="wa-flank:start wa-align-items-center"
          style={{ '--flank-size': 'auto' } as React.CSSProperties}
        >
          <Icon
            name="calendar-days"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          />
          <p
            className="wa-body-s"
            style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
          >
            <FormatDate date="2025-03-15" />
          </p>
        </div>

        <div
          className="wa-flank:start wa-align-items-center"
          style={{ '--flank-size': 'auto' } as React.CSSProperties}
        >
          <Icon
            name="coin-vertical"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          />
          <p
            className="wa-body-s"
            style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
          >
            Paid with copper pennies
          </p>
        </div>
      </div>

      {/* Footer Button */}
      <div slot="footer">
        <Button variant="success" appearance="accent" style={{ width: '100%' }}>
          <Icon name="arrow-down-to-bracket" />
          Download Receipt
        </Button>
      </div>
    </Card>
  );
}
