import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import NumberInput from './NumberInput.vue';

describe('NumberInput', () => {
  it('renders without crashing', () => {
    const { container } = mount(NumberInput);
    expect(container.querySelector('wa-number-input')).toBeTruthy();
  });
});
