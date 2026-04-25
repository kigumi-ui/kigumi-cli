import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Button from './Button.vue';

describe('Button', () => {
  it('renders without crashing', () => {
    const { container } = mount(Button);
    expect(container.querySelector('wa-button')).toBeTruthy();
  });
});
