import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResizeObserver } from './ResizeObserver';

describe('ResizeObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(<ResizeObserver />);
    expect(container.querySelector('wa-resize-observer')).toBeTruthy();
  });
});
