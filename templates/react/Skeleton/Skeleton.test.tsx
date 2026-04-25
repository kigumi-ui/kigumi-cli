import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('wa-skeleton')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-skeleton', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const element = container.querySelector('wa-skeleton');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
