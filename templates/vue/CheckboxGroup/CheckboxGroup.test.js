import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import CheckboxGroup from './CheckboxGroup.vue';

describe('CheckboxGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(CheckboxGroup);
    expect(container.querySelector('wa-checkbox-group')).toBeTruthy();
  });
});
