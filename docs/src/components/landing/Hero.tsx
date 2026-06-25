import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import stacksImg from '@/assets/stacks.png';
import { Badge, Button, ButtonGroup, Icon } from '@/components/ui';

export function Hero() {
  return (
    <div slot="main-header" className="hero">
      <div className="hero__layout wa-gap-4xl">
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
              Components that outlive your framework choice
            </h1>
            <h2 className="wa-caption-xl hero__subheading">
              Generate ready-to-use React, Vue, Angular, and Next.js components.
              Accessible, themeable, and fully yours.
            </h2>
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
            </div>
          </div>

          <div
            className="wa-stack wa-gap-s"
            style={{ minWidth: '100%', maxWidth: '480px' }}
          >
            <InstallCommandExample />
          </div>
        </div>

        <div className="hero__visual">
          <img
            src={stacksImg}
            alt="React, Vue, Angular, Next.js framework logos stacked"
            className="hero__stacks-img"
          />
        </div>
      </div>
    </div>
  );
}
