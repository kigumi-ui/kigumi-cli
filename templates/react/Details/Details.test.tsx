import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Details } from './Details';

describe('Details', () => {
  it('renders without crashing', () => {
    const { container } = render(<Details />);
    expect(container.querySelector('wa-details')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-details', () => {
    const { container } = render(<Details className="custom-class" />);
    const element = container.querySelector('wa-details');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
