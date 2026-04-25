import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Details from './Details.vue';

describe('Details', () => {
  it('renders without crashing', () => {
    const { container } = mount(Details);
    expect(container.querySelector('wa-details')).toBeTruthy();
  });
});
