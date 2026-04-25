import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import FormatBytes from './FormatBytes.vue';

describe('FormatBytes', () => {
  it('renders without crashing', () => {
    const { container } = render(FormatBytes);
    expect(container.querySelector('wa-format-bytes')).toBeTruthy();
  });
});
