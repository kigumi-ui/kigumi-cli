import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector('wa-number-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-number-input', () => {
    const { container } = render(<NumberInput className="custom-class" />);
    const element = container.querySelector('wa-number-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
