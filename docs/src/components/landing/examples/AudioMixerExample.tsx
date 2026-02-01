import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Slider } from '@/components/ui/Slider/Slider';
import { Icon } from '@/components/ui/Icon/Icon';

export function AudioMixerExample() {
  const [levels, setLevels] = useState({
    drums: 4,
    guitar: 4,
    vocals: 5,
  });

  const updateLevel = (instrument: keyof typeof levels, value: number) => {
    setLevels((prev) => ({ ...prev, [instrument]: value }));
  };

  return (
    <Card>
      <div className="wa-split:row wa-gap-s wa-align-items-end">
        {/* Drums */}
        <div className="wa-stack wa-gap-xs wa-align-items-center">
          <Slider
            orientation="vertical"
            min={0}
            max={8}
            value={levels.drums}
            onInput={(e) =>
              updateLevel('drums', (e.target as HTMLInputElement).valueAsNumber)
            }
            style={{ height: '200px' }}
          />
          <Icon name="drum" className="wa-caption-s" />
          <span
            className="wa-caption-2xs"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            Drums
          </span>
        </div>

        {/* Guitar */}
        <div className="wa-stack wa-gap-xs wa-align-items-center">
          <Slider
            orientation="vertical"
            min={0}
            max={8}
            value={levels.guitar}
            onInput={(e) =>
              updateLevel(
                'guitar',
                (e.target as HTMLInputElement).valueAsNumber
              )
            }
            style={{ height: '200px' }}
          />
          <Icon name="guitar" className="wa-caption-s" />
          <span
            className="wa-caption-2xs"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            Guitar
          </span>
        </div>

        {/* Vocals */}
        <div className="wa-stack wa-gap-xs wa-align-items-center">
          <Slider
            orientation="vertical"
            min={0}
            max={8}
            value={levels.vocals}
            onInput={(e) =>
              updateLevel(
                'vocals',
                (e.target as HTMLInputElement).valueAsNumber
              )
            }
            style={{ height: '200px' }}
          />
          <Icon name="microphone" className="wa-caption-s" />
          <span
            className="wa-caption-2xs"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            Vocals
          </span>
        </div>
      </div>
    </Card>
  );
}
