import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RadioGroup } from './RadioGroup';

describe('RadioGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<RadioGroup />);
    expect(container.querySelector('wa-radio-group')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-radio-group', () => {
    const { container } = render(<RadioGroup className="custom-class" />);
    const element = container.querySelector('wa-radio-group');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
