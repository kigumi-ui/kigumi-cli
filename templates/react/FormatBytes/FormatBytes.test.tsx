import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FormatBytes } from './FormatBytes';

describe('FormatBytes', () => {
  it('renders without crashing', () => {
    const { container } = render(<FormatBytes />);
    expect(container.querySelector('wa-format-bytes')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-format-bytes', () => {
    const { container } = render(<FormatBytes className="custom-class" />);
    const element = container.querySelector('wa-format-bytes');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
