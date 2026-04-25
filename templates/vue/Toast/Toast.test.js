import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Toast from './Toast.vue';

describe('Toast', () => {
  it('renders without crashing', () => {
    const { container } = mount(Toast);
    expect(container.querySelector('wa-toast')).toBeTruthy();
  });
});
