import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders without crashing', () => {
    const { container } = render(<Callout />);
    expect(container.querySelector('wa-callout')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-callout', () => {
    const { container } = render(<Callout className="custom-class" />);
    const element = container.querySelector('wa-callout');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
