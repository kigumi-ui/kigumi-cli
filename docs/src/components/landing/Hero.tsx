import { InstallCommandExample } from '@/components/landing/examples/InstallCommandExample';
import { Badge, Icon, Tooltip } from '@/components/ui';
import stacks from '@/assets/stacks.png';
import { useEffect, useRef } from 'react';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import svelteLogo from '@/assets/svelte-logo.svg';

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

        <div className="wa-stack wa-gap-xs">
          <p className="wa-caption-m">Compatible with:</p>
          <span className="wa-span-grid wa-gap-xs wa-align-items-center">
            <img
              id="react-logo"
              src={reactLogo}
              alt="React"
              style={{ width: '32px', height: '32px' }}
            />
            <img
              id="vue-logo"
              src={vueLogo}
              alt="Vue"
              style={{ width: '32px', height: '32px' }}
            />
            <Tooltip for="angular-logo">Coming soon</Tooltip>
            <img
              id="angular-logo"
              src={angularLogo}
              alt="Angular"
              style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(1)',
                opacity: 0.5,
              }}
            />
            <Tooltip for="svelte-logo">Coming soon</Tooltip>
            <img
              id="svelte-logo"
              src={svelteLogo}
              alt="Svelte"
              style={{
                width: '32px',
                height: '32px',
                filter: 'grayscale(1)',
                opacity: 0.5,
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
