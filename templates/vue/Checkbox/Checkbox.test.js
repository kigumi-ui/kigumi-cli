import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Checkbox from './Checkbox.vue';

describe('Checkbox', () => {
  it('renders without crashing', () => {
    const { container } = render(Checkbox);
    expect(container.querySelector('wa-checkbox')).toBeTruthy();
  });
});
