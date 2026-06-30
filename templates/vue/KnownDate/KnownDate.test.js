import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import KnownDate from './KnownDate.vue';

describe('KnownDate', () => {
  it('renders without crashing', () => {
    const { container } = render(KnownDate);
    expect(container.querySelector('wa-known-date')).toBeTruthy();
  });
});
