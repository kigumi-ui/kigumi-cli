import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ProgressRing from './ProgressRing.vue';

describe('ProgressRing', () => {
  it('renders without crashing', () => {
    const { container } = mount(ProgressRing);
    expect(container.querySelector('wa-progress-ring')).toBeTruthy();
  });
});
