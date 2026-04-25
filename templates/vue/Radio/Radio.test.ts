import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Radio from './Radio.vue';

describe('Radio', () => {
  it('renders without crashing', () => {
    const { container } = mount(Radio);
    expect(container.querySelector('wa-radio')).toBeTruthy();
  });
});
