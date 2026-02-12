import { useState } from 'react';
import { Badge, Button, Icon } from '@/components/ui';

const BANNER_STORAGE_KEY = 'banner-dismissed';

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
    <div slot="banner" className="banner wa-gap-xs wa-justify-content-center">
      <div className="banner__content wa-flank:end">
        <span className="wa-gap-xs">
          <Badge pill variant="neutral" appearance="accent">
            New
          </Badge>
          React and Vue now available in beta.
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
