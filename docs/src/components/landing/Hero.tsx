import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import { Badge, Callout, Icon } from '@/components/ui';

export function Hero() {
  return (
    <div slot="main-header">
      <div className="wa-stack wa-gap-m wa-align-items-start">
        <Badge pill className="wa-font-size-s">
          <Icon name="tag" />v{__CLI_VERSION__}
        </Badge>
        <h1 className="wa-heading-4xl">Welcome to Kigumi</h1>
        <h2 className="wa-caption-2xl">
          Build framework-agnostic UIs with ready-made web components.{' '}
          <strong>Same components, any stack.</strong>
        </h2>
      </div>
      <div className="wa-stack wa-align-items-start wa-gap-m">
        <InstallCommandExample />
        <Callout appearance="outlined">
          <Icon slot="icon" name="circle-info" />
          <strong>Available for React.</strong> Angular, Svelte and Vue are
          coming soon.
        </Callout>
      </div>
    </div>
  );
}
