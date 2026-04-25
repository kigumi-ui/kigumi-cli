import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders without crashing', () => {
    const { container } = render(<Badge />);
    expect(container.querySelector('wa-badge')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-badge', () => {
    const { container } = render(<Badge className="custom-class" />);
    const element = container.querySelector('wa-badge');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
