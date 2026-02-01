import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';

export function MusicPlayerExample() {
  const [playing, setPlaying] = useState(true);
  const [progress, _setProgress] = useState(34);

  return (
    <Card appearance="outlined" className="wa-dark">
      <div className="wa-stack wa-gap-s">
        {/* Album Art and Info */}
        <div
          className="wa-flank wa-align-items-center"
          style={{ '--flank-size': '6rem' } as React.CSSProperties}
        >
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop"
            alt="Album art"
            style={{
              width: '6rem',
              height: '6rem',
              borderRadius: 'var(--wa-border-radius-m)',
              objectFit: 'cover',
            }}
          />
          <div className="wa-stack wa-gap-2xs">
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              The Stone Troll (Shire Remix)
            </h3>
            <p
              className="wa-caption-s"
              style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
            >
              Samwise G + Gandalf the Grey
            </p>
          </div>
        </div>

        {/* Progress Bar with Time */}
        <div className="wa-stack wa-gap-2xs">
          <ProgressBar value={progress} />
          <div className="wa-split:row">
            <span
              className="wa-caption-2xs"
              style={{ color: 'var(--wa-color-neutral-60)' }}
            >
              1:01
            </span>
            <span
              className="wa-caption-2xs"
              style={{ color: 'var(--wa-color-neutral-60)' }}
            >
              -1:58
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="wa-cluster wa-gap-xs wa-align-items-center wa-justify-content-center">
          <Button appearance="plain" size="small">
            <Icon name="shuffle" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="backward" />
          </Button>
          <Button
            appearance="plain"
            size="large"
            onClick={() => setPlaying(!playing)}
          >
            <Icon name={playing ? 'circle-pause' : 'circle-play'} />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="forward" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="repeat" />
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="wa-cluster wa-gap-xs wa-align-items-center wa-justify-content-center">
          <Button appearance="plain" size="small">
            <Icon name="arrow-up-from-bracket" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="heart" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="arrow-down-to-bracket" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="ellipsis-vertical" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
