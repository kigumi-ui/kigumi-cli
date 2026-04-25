import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import FormatNumber from './FormatNumber.vue';

describe('FormatNumber', () => {
  it('renders without crashing', () => {
    const { container } = render(FormatNumber);
    expect(container.querySelector('wa-format-number')).toBeTruthy();
  });
});
