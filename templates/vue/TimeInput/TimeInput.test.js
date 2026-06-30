import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import TimeInput from './TimeInput.vue';

describe('TimeInput', () => {
  it('renders without crashing', () => {
    const { container } = render(TimeInput);
    expect(container.querySelector('wa-time-input')).toBeTruthy();
  });
});
