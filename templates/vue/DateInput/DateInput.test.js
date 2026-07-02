import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import DateInput from './DateInput.vue';

describe('DateInput', () => {
  it('renders without crashing', () => {
    const { container } = render(DateInput);
    expect(container.querySelector('wa-date-input')).toBeTruthy();
  });
});
