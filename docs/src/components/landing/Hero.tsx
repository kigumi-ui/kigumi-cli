import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import { Badge, Button, Icon } from '@/components/ui';
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
    <div slot="main-header" className="wa-stack wa-align-items-start">
      <div className="wa-grid wa-align-items-start">
        <div className="wa-stack wa-gap-l wa-align-items-start">
          <div className="wa-stack wa-align-items-start wa-gap-xs">
            <Badge pill className="wa-font-size-s">
              <Icon name="tag" />v{__CLI_VERSION__}
            </Badge>
            <h1 className="wa-heading-4xl heading-1">
              Build framework-agnostic UIs
            </h1>
            <h2 className="wa-caption-2xl heading-2">
              with ready-made web components. Same components, any stack.
            </h2>
          </div>
          <div className="wa-stack wa-gap-l wa-align-items-start">
            <div className="wa-cluster wa-gap-m">
              <Button variant="brand" size="medium" href="#getting-started">
                Get started
              </Button>
              <Button
                variant="neutral"
                size="medium"
                appearance="plain"
                href="https://webawesome.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read docs
                <Icon name="external-link" slot="end" />
              </Button>
            </div>
            <InstallCommandExample />
            <CompatibilityInfo />
          </div>
        </div>
        <img ref={stacksRef} src={stacks} alt="Stacks" className="stacks" />
      </div>
    </div>
  );
}
