import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ProgressRing from './ProgressRing.vue';

describe('ProgressRing', () => {
  it('renders without crashing', () => {
    const { container } = render(ProgressRing);
    expect(container.querySelector('wa-progress-ring')).toBeTruthy();
  });
});
