import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Animation } from './Animation';

describe('Animation', () => {
  it('renders without crashing', () => {
    const { container } = render(<Animation />);
    expect(container.querySelector('wa-animation')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-animation', () => {
    const { container } = render(<Animation className="custom-class" />);
    const element = container.querySelector('wa-animation');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
