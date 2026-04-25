import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Input from './Input.vue';

describe('Input', () => {
  it('renders without crashing', () => {
    const { container } = mount(Input);
    expect(container.querySelector('wa-input')).toBeTruthy();
  });
});
