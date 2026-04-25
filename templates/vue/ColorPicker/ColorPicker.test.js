import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ColorPicker from './ColorPicker.vue';

describe('ColorPicker', () => {
  it('renders without crashing', () => {
    const { container } = mount(ColorPicker);
    expect(container.querySelector('wa-color-picker')).toBeTruthy();
  });
});
