import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Tooltip from './Tooltip.vue';

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const { container } = render(Tooltip);
    expect(container.querySelector('wa-tooltip')).toBeTruthy();
  });
});
