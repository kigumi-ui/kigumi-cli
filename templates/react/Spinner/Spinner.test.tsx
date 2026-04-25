import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('wa-spinner')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-spinner', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const element = container.querySelector('wa-spinner');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
