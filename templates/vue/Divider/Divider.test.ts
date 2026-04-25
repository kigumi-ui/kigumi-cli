import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Divider from './Divider.vue';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { container } = mount(Divider);
    expect(container.querySelector('wa-divider')).toBeTruthy();
  });
});
