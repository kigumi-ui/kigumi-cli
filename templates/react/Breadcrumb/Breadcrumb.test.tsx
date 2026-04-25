import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(<Breadcrumb />);
    expect(container.querySelector('wa-breadcrumb')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-breadcrumb', () => {
    const { container } = render(<Breadcrumb className="custom-class" />);
    const element = container.querySelector('wa-breadcrumb');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
