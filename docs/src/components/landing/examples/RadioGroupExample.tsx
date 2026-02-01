import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { RadioGroup } from '@/components/ui/RadioGroup/RadioGroup';
import { Radio } from '@/components/ui/Radio/Radio';
import { Icon } from '@/components/ui/Icon/Icon';

export function RadioGroupExample() {
  const [choice, setChoice] = useState('');

  return (
    <Card appearance="outlined">
      <RadioGroup
        label="You there! Cake or Death?"
        hint="We're gonna run out of cake at this rate."
        value={choice}
        onWaChange={(e) => setChoice((e.target as HTMLInputElement).value)}
      >
        <div className="wa-cluster wa-gap-s">
          <Radio value="1" appearance="button">
            <div className="wa-cluster wa-gap-s wa-align-items-center">
              <Icon name="cake-candles" />
              <span>Cake</span>
            </div>
          </Radio>
          <Radio value="2" appearance="button">
            <div className="wa-cluster wa-gap-s wa-align-items-center">
              <Icon name="skull-crossbones" />
              <span>Death</span>
            </div>
          </Radio>
        </div>
      </RadioGroup>
    </Card>
  );
}
