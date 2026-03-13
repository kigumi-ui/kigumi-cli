import { Tooltip } from '@/components/ui';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import svelteLogo from '@/assets/svelte-logo.svg';
import vitejsLogo from '@/assets/vitejs-logo.svg';

export const CompatibilityInfo = () => {
  return (
    <div className="wa-stack wa-gap-xs">
      <p className="wa-caption-xs">Compatible with Node 20+ and</p>
      <span className="wa-span-grid wa-gap-xs wa-align-items-center">
        <img
          id="vitejs-logo"
          src={vitejsLogo}
          alt="Vite"
          style={{ width: '24px', height: '24px' }}
        />
        <img
          id="react-logo"
          src={reactLogo}
          alt="React"
          style={{ width: '24px', height: '24px' }}
        />
        <img
          id="vue-logo"
          src={vueLogo}
          alt="Vue"
          style={{ width: '24px', height: '24px' }}
        />
        <Tooltip for="angular-logo">Coming soon</Tooltip>
        <img
          id="angular-logo"
          src={angularLogo}
          alt="Angular"
          style={{
            width: '24px',
            height: '24px',
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
            width: '24px',
            height: '24px',
            filter: 'grayscale(1)',
            opacity: 0.5,
          }}
        />
      </span>
    </div>
  );
};
