import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Select from './Select.vue';

describe('Select', () => {
  it('renders without crashing', () => {
    const { container } = render(Select);
    expect(container.querySelector('wa-select')).toBeTruthy();
  });
});
