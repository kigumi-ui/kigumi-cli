import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Option } from './Option';

describe('Option', () => {
  it('renders without crashing', () => {
    const { container } = render(<Option />);
    expect(container.querySelector('wa-option')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-option', () => {
    const { container } = render(<Option className="custom-class" />);
    const element = container.querySelector('wa-option');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
