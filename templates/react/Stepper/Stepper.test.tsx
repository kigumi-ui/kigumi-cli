import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('renders without crashing', () => {
    const { container } = render(<Stepper />);
    expect(container.querySelector('wa-stepper')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-stepper', () => {
    const { container } = render(<Stepper className="custom-class" />);
    const element = container.querySelector('wa-stepper');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
