import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { KnownDate } from './KnownDate';

describe('KnownDate', () => {
  it('renders without crashing', () => {
    const { container } = render(<KnownDate />);
    expect(container.querySelector('wa-known-date')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-known-date', () => {
    const { container } = render(<KnownDate className="custom-class" />);
    const element = container.querySelector('wa-known-date');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('passes value prop', () => {
    const { container } = render(<KnownDate value="1990-06-15" />);
    const element = container.querySelector('wa-known-date');
    expect(element?.getAttribute('value')).toBe('1990-06-15');
  });
});
