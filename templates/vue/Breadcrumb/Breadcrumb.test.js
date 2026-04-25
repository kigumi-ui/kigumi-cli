import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Breadcrumb from './Breadcrumb.vue';

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(Breadcrumb);
    expect(container.querySelector('wa-breadcrumb')).toBeTruthy();
  });
});
