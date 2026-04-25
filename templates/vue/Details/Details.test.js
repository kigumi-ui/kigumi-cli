import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Details from './Details.vue';

describe('Details', () => {
  it('renders without crashing', () => {
    const { container } = render(Details);
    expect(container.querySelector('wa-details')).toBeTruthy();
  });
});
