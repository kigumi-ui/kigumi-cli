import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import FormatDate from './FormatDate.vue';

describe('FormatDate', () => {
  it('renders without crashing', () => {
    const { container } = render(FormatDate);
    expect(container.querySelector('wa-format-date')).toBeTruthy();
  });
});
