import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import BreadcrumbItem from './BreadcrumbItem.vue';

describe('BreadcrumbItem', () => {
  it('renders without crashing', () => {
    const { container } = render(BreadcrumbItem);
    expect(container.querySelector('wa-breadcrumb-item')).toBeTruthy();
  });
});
