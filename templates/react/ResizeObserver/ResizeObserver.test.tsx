import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResizeObserver } from './ResizeObserver';

describe('ResizeObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(<ResizeObserver />);
    expect(container.querySelector('wa-resize-observer')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-resize-observer', () => {
    const { container } = render(<ResizeObserver className="custom-class" />);
    const element = container.querySelector('wa-resize-observer');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
