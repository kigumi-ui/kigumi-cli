import { useState } from 'react';
import { Badge, Button, Icon } from '@/components/ui';

const BANNER_STORAGE_KEY = 'banner-20260320-dismissed';

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
        <Badge pill variant="neutral" appearance="accent" attention="pulse">
          New
        </Badge>
        <span>
          The{' '}
          <a
            href="https://marketplace.visualstudio.com/items?itemName=Kigumi.kigumi-intellisense"
            target="_blank"
            className="wa-text-link"
            rel="noopener noreferrer"
          >
            Kigumi IntelliSense
          </a>{' '}
          extension for <strong>Cursor</strong> and <strong>VS Code</strong> is
          now available.
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
