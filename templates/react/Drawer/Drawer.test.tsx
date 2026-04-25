import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders without crashing', () => {
    const { container } = render(<Drawer />);
    expect(container.querySelector('wa-drawer')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-drawer', () => {
    const { container } = render(<Drawer className="custom-class" />);
    const element = container.querySelector('wa-drawer');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
