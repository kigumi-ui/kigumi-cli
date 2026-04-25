import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import NumberInput from './NumberInput.vue';

describe('NumberInput', () => {
  it('renders without crashing', () => {
    const { container } = render(NumberInput);
    expect(container.querySelector('wa-number-input')).toBeTruthy();
  });
});
