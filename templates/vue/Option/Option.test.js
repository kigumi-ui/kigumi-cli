import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Option from './Option.vue';

describe('Option', () => {
  it('renders without crashing', () => {
    const { container } = render(Option);
    expect(container.querySelector('wa-option')).toBeTruthy();
  });
});
