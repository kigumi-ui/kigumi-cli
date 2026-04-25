import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Popover from './Popover.vue';

describe('Popover', () => {
  it('renders without crashing', () => {
    const { container } = render(Popover);
    expect(container.querySelector('wa-popover')).toBeTruthy();
  });
});
