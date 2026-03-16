import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import { Badge, Button, ButtonGroup, Icon } from '@/components/ui';
import stacks from '@/assets/stacks.png';
import { useEffect, useRef } from 'react';
import { CompatibilityInfo } from '@/components/landing/CompatibilityInfo';

export function Hero() {
  const stacksRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const stacksElement = stacksRef.current;
    if (!stacksElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stacksElement.classList.add('stacks--animate');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(stacksElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div slot="main-header" className="wa-align-items-start wa-stack">
      <div className="wa-grid wa-align-items-start">
        <div className="wa-stack wa-align-items-start">
          <div className="wa-stack wa-align-items-start wa-gap-xs">
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
            <h1 className="wa-heading-4xl heading-1">
              Build framework-agnostic UIs
            </h1>
            <h2 className="wa-caption-2xl heading-2">
              Ready-made web components for your design system via CLI.{' '}
              <strong>Same components, any stack.</strong>
            </h2>
          </div>

          <div className="wa-stack wa-gap-2xl wa-align-items-start">
            <div className="wa-cluster wa-gap-m">
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
            <div className="wa-stack wa-gap-m">
              <InstallCommandExample />
              <CompatibilityInfo />
            </div>
          </div>
        </div>
        <img
          ref={stacksRef}
          src={stacks}
          alt="React, Vue, and TypeScript logos connected with Web Awesome components"
          className="stacks"
        />
      </div>
    </div>
  );
}
