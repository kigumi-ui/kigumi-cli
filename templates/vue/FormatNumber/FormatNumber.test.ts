import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import FormatNumber from './FormatNumber.vue';

describe('FormatNumber', () => {
  it('renders without crashing', () => {
    const { container } = mount(FormatNumber);
    expect(container.querySelector('wa-format-number')).toBeTruthy();
  });
});
