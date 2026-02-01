import { Card } from '@/components/ui/Card/Card';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';

export function UserProfileCardExample() {
  return (
    <Card appearance="outlined">
      {/* Header with Name, Badge, and Avatar */}
      <div className="wa-flank:end wa-align-items-center">
        <div className="wa-stack wa-gap-2xs">
          <div className="wa-cluster wa-gap-xs wa-align-items-center">
            <h3 className="wa-heading-m" style={{ margin: 0 }}>
              Migs Mayfeld
            </h3>
            <Badge pill variant="brand" appearance="accent">
              Admin
            </Badge>
          </div>
          <p
            className="wa-body-s"
            style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
          >
            Remorseful Imperial Sharpshooter
          </p>
        </div>

        <Avatar
          image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
          label="Migs Mayfeld"
          shape="circle"
        />
      </div>

      {/* Footer with Action Buttons */}
      <div slot="footer">
        <div className="wa-cluster wa-gap-xs">
          <Button appearance="outlined" size="small">
            <Icon name="at" />
          </Button>
          <Button appearance="outlined" size="small">
            <Icon name="message" />
          </Button>
          <Button appearance="outlined" size="small">
            <Icon name="phone" />
          </Button>
          <Button appearance="accent" size="small" style={{ flex: 1 }}>
            <Icon name="linkedin" family="brands" />
            Connect on LukedIn
          </Button>
        </div>
      </div>
    </Card>
  );
}
