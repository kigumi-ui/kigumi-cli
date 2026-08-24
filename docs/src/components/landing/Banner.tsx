import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';

const BANNER_STORAGE_KEY = 'banner-20260823-dismissed';

export const Banner = () => {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(BANNER_STORAGE_KEY) === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      slot="banner"
      className="banner wa-gap-xs wa-justify-content-center wa-align-items-center"
    >
      <div className="banner__content wa-gap-s wa-align-items-center wa-justify-content-center">
        <span>
          <strong>Next.js</strong> is now supported. Use{' '}
          <code>npx kigumi upgrade</code> to install the latest version or try
          the{' '}
          <a
            href="https://github.com/kigumi-ui/kigumi-next-starter"
            target="_blank"
            className="wa-text-link"
            rel="noopener noreferrer"
          >
            Next.js starter
          </a>{' '}
          template.
        </span>
      </div>
      <Button
        onClick={handleDismiss}
        appearance="plain"
        size="small"
        aria-label="Dismiss banner"
        variant="neutral"
        pill
        className="banner__dismiss"
      >
        <Icon name="xmark" />
      </Button>
    </div>
  );
};
