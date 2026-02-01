import { Card } from '@/components/ui/Card/Card';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Icon } from '@/components/ui/Icon/Icon';
import { Button } from '@/components/ui/Button/Button';

export function ShoppingCartExample() {
  return (
    <Card appearance="outlined">
      {/* Header */}
      <div slot="header" className="wa-split:row wa-align-items-center">
        <h3 className="wa-heading-m" style={{ margin: 0 }}>
          Shopping Cart
        </h3>
        <Button appearance="plain" size="small">
          <Icon name="xmark" />
        </Button>
      </div>

      {/* Body */}
      <div className="wa-stack wa-gap-s">
        {/* Item 1 */}
        <div className="wa-flank:end wa-align-items-center">
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <Avatar
              shape="rounded"
              style={{
                backgroundColor: 'var(--wa-color-blue-60)',
                color: 'var(--wa-color-blue-95)',
              }}
            >
              <Icon name="sword-laser" />
            </Avatar>
            <div className="wa-stack wa-gap-2xs">
              <p className="wa-body-s" style={{ fontWeight: 600, margin: 0 }}>
                Initiate Saber
              </p>
              <p
                className="wa-caption-s"
                style={{ color: 'var(--wa-color-neutral-60)', margin: 0 }}
              >
                $19.99
              </p>
            </div>
          </div>
          <Button appearance="plain" size="small" variant="danger">
            <Icon name="trash" />
          </Button>
        </div>

        {/* Item 2 */}
        <div className="wa-flank:end wa-align-items-center">
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <Avatar
              shape="rounded"
              style={{
                backgroundColor: 'var(--wa-color-green-60)',
                color: 'var(--wa-color-green-95)',
              }}
            >
              <Icon name="robot-astromech" />
            </Avatar>
            <div className="wa-stack wa-gap-2xs">
              <p className="wa-body-s" style={{ fontWeight: 600, margin: 0 }}>
                Repair Droid
              </p>
              <p
                className="wa-caption-s"
                style={{ color: 'var(--wa-color-neutral-60)', margin: 0 }}
              >
                $49.99
              </p>
            </div>
          </div>
          <Button appearance="plain" size="small" variant="danger">
            <Icon name="trash" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div slot="footer" className="wa-stack wa-gap-s">
        <div className="wa-split:row">
          <p className="wa-body-s" style={{ margin: 0 }}>
            Subtotal
          </p>
          <p className="wa-body-s" style={{ fontWeight: 600, margin: 0 }}>
            $69.98
          </p>
        </div>
        <Button variant="brand" appearance="accent">
          <Icon name="shopping-bag" />
          Checkout
        </Button>
      </div>
    </Card>
  );
}
