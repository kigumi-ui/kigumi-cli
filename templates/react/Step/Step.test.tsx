import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Step } from './Step';

describe('Step', () => {
  it('renders without crashing', () => {
    const { container } = render(<Step />);
    expect(container.querySelector('wa-step')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-step', () => {
    const { container } = render(<Step className="custom-class" />);
    const element = container.querySelector('wa-step');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
