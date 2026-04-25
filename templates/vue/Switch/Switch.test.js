import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Switch from './Switch.vue';

describe('Switch', () => {
  it('renders without crashing', () => {
    const { container } = render(Switch);
    expect(container.querySelector('wa-switch')).toBeTruthy();
  });
});
