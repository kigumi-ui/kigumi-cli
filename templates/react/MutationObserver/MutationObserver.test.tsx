import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MutationObserver } from './MutationObserver';

describe('MutationObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(<MutationObserver />);
    expect(container.querySelector('wa-mutation-observer')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-mutation-observer', () => {
    const { container } = render(<MutationObserver className="custom-class" />);
    const element = container.querySelector('wa-mutation-observer');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
