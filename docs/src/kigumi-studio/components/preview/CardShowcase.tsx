import { Card, Button, Icon, Badge } from '@/components/ui';

export function CardShowcase() {
  return (
    <section className="showcase-section">
      <h3 className="wa-heading-m showcase-section__title">Card</h3>
      <Card style={{ maxWidth: '360px' }}>
        <div
          slot="header"
          className="wa-split wa-align-items-center"
          style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
        >
          <span className="wa-heading-s">Project Update</span>
          <Badge variant="brand">New</Badge>
        </div>
        <div style={{ padding: 'var(--wa-space-m)' }}>
          <p style={{ margin: 0, color: 'var(--wa-color-text-quiet)' }}>
            The latest release includes improved theming support, new
            components, and performance optimizations across the board.
          </p>
        </div>
        <div
          slot="footer"
          className="wa-cluster wa-gap-s wa-justify-content-end"
          style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
        >
          <Button variant="neutral" appearance="outlined" size="small">
            Dismiss
          </Button>
          <Button variant="brand" size="small">
            <Icon name="arrow-right" slot="end" />
            View Details
          </Button>
        </div>
      </Card>
    </section>
  );
}
