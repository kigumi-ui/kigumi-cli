import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Dropdown from './Dropdown.vue';

describe('Dropdown', () => {
  it('renders without crashing', () => {
    const { container } = render(Dropdown);
    expect(container.querySelector('wa-dropdown')).toBeTruthy();
  });
});
