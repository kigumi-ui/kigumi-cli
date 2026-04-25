import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Radio from './Radio.vue';

describe('Radio', () => {
  it('renders without crashing', () => {
    const { container } = render(Radio);
    expect(container.querySelector('wa-radio')).toBeTruthy();
  });
});
