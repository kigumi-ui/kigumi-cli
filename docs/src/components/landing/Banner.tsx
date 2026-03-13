import { useState } from 'react';
import { Badge, Button, Icon } from '@/components/ui';

const BANNER_STORAGE_KEY = 'banner-20260312-dismissed';

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
          New feature
        </Badge>
        <span>
          Use <code>npx kigumi registry</code> to consume components and themes
          from the community!{' '}
          <a
            href="https://docs.kigumi.style/?path=/docs/kigumi-community-registries--docs"
            target="_blank"
            className="wa-text-link"
            rel="noopener noreferrer"
          >
            Read more
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
