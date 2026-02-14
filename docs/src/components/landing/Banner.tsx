import { useState } from 'react';
import { Badge, Button, Icon } from '@/components/ui';
import { Link } from 'react-router-dom';

const BANNER_STORAGE_KEY = 'banner-20260214-dismissed';

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
        <Badge pill variant="neutral" appearance="accent">
          New feature
        </Badge>
        <span>
          Create your own themes with{' '}
          <Link to="/kigumi-studio">Kigumi Studio</Link>!
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
