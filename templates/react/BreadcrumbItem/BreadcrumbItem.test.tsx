import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BreadcrumbItem } from './BreadcrumbItem';

describe('BreadcrumbItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<BreadcrumbItem />);
    expect(container.querySelector('wa-breadcrumb-item')).toBeTruthy();
  });
});
