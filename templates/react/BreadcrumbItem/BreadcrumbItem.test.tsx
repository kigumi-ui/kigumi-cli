import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BreadcrumbItem } from './BreadcrumbItem';

describe('BreadcrumbItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<BreadcrumbItem />);
    expect(container.querySelector('wa-breadcrumb-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-breadcrumb-item', () => {
    const { container } = render(<BreadcrumbItem className="custom-class" />);
    const element = container.querySelector('wa-breadcrumb-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
