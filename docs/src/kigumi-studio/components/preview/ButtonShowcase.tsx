import { Button, Icon } from '@/components/ui';

export function ButtonShowcase() {
  return (
    <section className="showcase-section">
      <h3 className="wa-heading-m showcase-section__title">Buttons</h3>
      <div className="wa-cluster wa-gap-s" style={{ flexWrap: 'wrap' }}>
        <Button variant="brand" appearance="accent">
          Brand
        </Button>
        <Button variant="brand" appearance="filled">
          Filled
        </Button>
        <Button variant="brand" appearance="outlined">
          Outlined
        </Button>
        <Button variant="brand" appearance="plain">
          Plain
        </Button>
      </div>
      <div
        className="wa-cluster wa-gap-s"
        style={{ flexWrap: 'wrap', marginTop: 'var(--wa-space-s)' }}
      >
        <Button variant="neutral" appearance="filled">
          Neutral
        </Button>
        <Button variant="success" appearance="filled">
          Success
        </Button>
        <Button variant="warning" appearance="filled">
          Warning
        </Button>
        <Button variant="danger" appearance="filled">
          Danger
        </Button>
      </div>
      <div
        className="wa-cluster wa-gap-s"
        style={{ flexWrap: 'wrap', marginTop: 'var(--wa-space-s)' }}
      >
        <Button variant="brand" size="small">
          Small
        </Button>
        <Button variant="brand" size="medium">
          Medium
        </Button>
        <Button variant="brand" size="large">
          Large
        </Button>
        <Button variant="brand" pill>
          <Icon name="gear" slot="start" />
          Pill
        </Button>
        <Button variant="brand" disabled>
          Disabled
        </Button>
      </div>
    </section>
  );
}
