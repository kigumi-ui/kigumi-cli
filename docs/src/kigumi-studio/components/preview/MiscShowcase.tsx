import { Divider, Avatar, ProgressBar, Callout, Icon } from '@/components/ui';

export function MiscShowcase() {
  return (
    <section className="showcase-section">
      <h3 className="wa-heading-m showcase-section__title">Miscellaneous</h3>
      <div className="wa-stack wa-gap-m">
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <Avatar initials="KS" label="Avatar KS" />
          <Avatar initials="AB" shape="rounded" label="Avatar AB" />
          <Avatar initials="CD" shape="square" label="Avatar CD" />
        </div>
        <Divider />
        <ProgressBar value={65} label="Progress" />
        <Callout variant="brand">
          <Icon name="circle-info" slot="icon" />
          This is an informational callout styled with your custom theme.
        </Callout>
        <Callout variant="warning">
          <Icon name="triangle-exclamation" slot="icon" />
          Warning: Review your configuration before deploying.
        </Callout>
      </div>
    </section>
  );
}
