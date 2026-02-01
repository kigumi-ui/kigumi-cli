import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Rating } from '@/components/ui/Rating/Rating';
import { Icon } from '@/components/ui/Icon/Icon';
import { Tag } from '@/components/ui/Tag/Tag';

export function RestaurantCardExample() {
  return (
    <Card appearance="outlined">
      <div className="wa-stack wa-gap-s">
        {/* Badge */}
        <div>
          <Badge appearance="filled" variant="success">
            Scoundrel Happy Hour!
          </Badge>
        </div>

        {/* Title */}
        <h3 className="wa-heading-m" style={{ margin: 0 }}>
          Chalmun's Spaceport Cantina
        </h3>

        {/* Rating and Reviews */}
        <div className="wa-cluster wa-gap-xs wa-align-items-center">
          <Rating value={4.1} readonly />
          <span
            className="wa-body-s"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            4.1 (419 reviews)
          </span>
        </div>

        {/* Price Indicators */}
        <div className="wa-cluster wa-gap-0 wa-align-items-center">
          <Icon name="dollar" style={{ color: 'var(--wa-color-green-60)' }} />
          <Icon name="dollar" style={{ color: 'var(--wa-color-green-60)' }} />
          <Icon name="dollar" style={{ color: 'var(--wa-color-green-60)' }} />
        </div>

        {/* Tags */}
        <div className="wa-cluster wa-gap-xs">
          <Tag size="small" variant="neutral" appearance="filled-outlined">
            Bar
          </Tag>
          <Tag size="small" variant="neutral" appearance="filled-outlined">
            Gastropub
          </Tag>
          <Tag size="small" variant="neutral" appearance="filled-outlined">
            Local Fare
          </Tag>
        </div>

        {/* Location */}
        <div
          className="wa-flank:start wa-align-items-center"
          style={{ '--flank-size': 'auto' } as React.CSSProperties}
        >
          <Icon name="location-dot" />
          <a
            href="#"
            className="wa-body-s"
            style={{
              color: 'var(--wa-color-neutral-60)',
              textDecoration: 'underline',
            }}
          >
            Mos Eisley, Tatooine
          </a>
        </div>
      </div>
    </Card>
  );
}
