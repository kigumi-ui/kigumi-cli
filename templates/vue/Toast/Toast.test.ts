import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Toast from './Toast.vue';

describe('Toast', () => {
  it('renders without crashing', () => {
    const { container } = render(Toast);
    expect(container.querySelector('wa-toast')).toBeTruthy();
  });
});
