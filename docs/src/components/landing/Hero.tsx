import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import { Badge, Callout, Icon } from '@/components/ui';
import stacks from '@/assets/stacks.png';
import { useEffect, useRef } from 'react';

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
          <div className="wa-stack wa-gap-2xs wa-align-items-start">
            <Badge pill className="wa-font-size-s">
              <Icon name="tag" />v{__CLI_VERSION__}
            </Badge>
            <h1 className="wa-heading-4xl">Welcome to Kigumi</h1>
          </div>
          <h2 className="wa-caption-2xl">
            Build framework-agnostic UIs with ready-made web components.{' '}
            <strong>Same components, any stack.</strong>
          </h2>
        </div>
        <img ref={stacksRef} src={stacks} alt="Stacks" className="stacks" />
      </div>
      <div className="wa-stack wa-gap-m">
        <InstallCommandExample />
        <Callout appearance="outlined" title="Beta">
          <Icon slot="icon" name="circle-info" />
          <strong>React and Vue are available.</strong> Angular and Svelte are
          coming soon.
        </Callout>
      </div>
    </div>
  );
}
