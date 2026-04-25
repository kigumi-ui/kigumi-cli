import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ToastItem from './ToastItem.vue';

describe('ToastItem', () => {
  it('renders without crashing', () => {
    const { container } = render(ToastItem);
    expect(container.querySelector('wa-toast-item')).toBeTruthy();
  });
});
