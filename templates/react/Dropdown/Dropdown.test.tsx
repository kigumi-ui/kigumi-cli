import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dropdown />);
    expect(container.querySelector('wa-dropdown')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-dropdown', () => {
    const { container } = render(<Dropdown className="custom-class" />);
    const element = container.querySelector('wa-dropdown');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
