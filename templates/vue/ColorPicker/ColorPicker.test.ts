import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ColorPicker from './ColorPicker.vue';

describe('ColorPicker', () => {
  it('renders without crashing', () => {
    const { container } = render(ColorPicker);
    expect(container.querySelector('wa-color-picker')).toBeTruthy();
  });
});
