import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import stacksImg from '@/assets/stacks.png';
import { Badge, Button, ButtonGroup, Icon } from '@/components/ui';

export function Hero() {
  return (
    <div slot="main-header" className="hero">
      <div className="hero__layout">
        <div className="hero__content wa-stack wa-align-items-start wa-gap-4xl">
          <div className="wa-stack">
            <a
              href={
                import.meta.env.DEV
                  ? 'http://localhost:6006/?path=/docs/general-changelog--docs'
                  : 'https://docs.kigumi.style/?path=/docs/general-changelog--docs'
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Badge pill className="wa-font-size-s">
                <Icon name="tag" />v{__CLI_VERSION__}
              </Badge>
            </a>
            <h1 className="wa-heading-4xl hero__heading">
              Build framework-agnostic UIs
            </h1>
            <h2 className="wa-caption-2xl hero__subheading wa-stack wa-gap-xs">
              Same components, any stack.
            </h2>
          </div>

          <div className="wa-cluster">
            <ButtonGroup>
              <Button variant="brand" size="medium" href="#getting-started">
                Get started
              </Button>
              <Button
                variant="brand"
                appearance="outlined"
                size="medium"
                href="/kigumi-studio"
              >
                Customize theme
              </Button>
            </ButtonGroup>
            <Button
              variant="neutral"
              size="medium"
              appearance="plain"
              href={
                import.meta.env.DEV
                  ? 'http://localhost:6006'
                  : 'https://docs.kigumi.style'
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Read docs
            </Button>
          </div>

          <div className="hero__install">
            <InstallCommandExample />
          </div>
        </div>

        <div className="hero__visual">
          <img
            src={stacksImg}
            alt="React, Vue, Angular, Svelte framework logos stacked"
            className="hero__stacks-img"
          />
        </div>
      </div>
    </div>
  );
}
