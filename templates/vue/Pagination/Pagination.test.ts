import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Pagination from './Pagination.vue';

describe('Pagination', () => {
  it('renders without crashing', () => {
    const { container } = render(Pagination);
    expect(container.querySelector('wa-pagination')).toBeTruthy();
  });
});
