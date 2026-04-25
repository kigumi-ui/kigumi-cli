import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Input from './Input.vue';

describe('Input', () => {
  it('renders without crashing', () => {
    const { container } = render(Input);
    expect(container.querySelector('wa-input')).toBeTruthy();
  });
});
