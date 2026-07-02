import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import DatePicker from './DatePicker.vue';

describe('DatePicker', () => {
  it('renders without crashing', () => {
    const { container } = render(DatePicker);
    expect(container.querySelector('wa-date-picker')).toBeTruthy();
  });
});
