import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Button from './Button.vue';

describe('Button', () => {
  it('renders without crashing', () => {
    const { container } = render(Button);
    expect(container.querySelector('wa-button')).toBeTruthy();
  });
});
