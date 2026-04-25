import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import FormatBytes from './FormatBytes.vue';

describe('FormatBytes', () => {
  it('renders without crashing', () => {
    const { container } = mount(FormatBytes);
    expect(container.querySelector('wa-format-bytes')).toBeTruthy();
  });
});
