import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RelativeTime } from './RelativeTime';

describe('RelativeTime', () => {
  it('renders without crashing', () => {
    const { container } = render(<RelativeTime />);
    expect(container.querySelector('wa-relative-time')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-relative-time', () => {
    const { container } = render(<RelativeTime className="custom-class" />);
    const element = container.querySelector('wa-relative-time');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
