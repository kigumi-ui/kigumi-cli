import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders without crashing', () => {
    const { container } = render(<Icon />);
    expect(container.querySelector('wa-icon')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-icon', () => {
    const { container } = render(<Icon className="custom-class" />);
    const element = container.querySelector('wa-icon');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
