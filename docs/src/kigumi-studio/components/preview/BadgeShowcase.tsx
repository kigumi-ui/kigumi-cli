import { Badge, Tag } from '@/components/ui';

export function BadgeShowcase() {
  return (
    <section className="showcase-section">
      <h3 className="wa-heading-m showcase-section__title">Badges & Tags</h3>
      <div className="wa-cluster wa-gap-s" style={{ flexWrap: 'wrap' }}>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
      <div
        className="wa-cluster wa-gap-s"
        style={{ flexWrap: 'wrap', marginTop: 'var(--wa-space-s)' }}
      >
        <Tag size="small" variant="brand">
          React
        </Tag>
        <Tag size="small" variant="neutral">
          TypeScript
        </Tag>
        <Tag size="small" variant="success">
          Stable
        </Tag>
        <Tag size="small" removable>
          Removable
        </Tag>
      </div>
    </section>
  );
}
