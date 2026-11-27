import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';

const BANNER_STORAGE_KEY = 'banner-20261127-dismissed';

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
          <strong>Kigumi Studio 0.3.0</strong>: let the Theme Agent shape your
          theme and catch contrast issues in the new accessibility devtools.{' '}
          <a href="/kigumi-studio" className="wa-text-link">
            Open Kigumi Studio
          </a>
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
