import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ProgressBar from './ProgressBar.vue';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(ProgressBar);
    expect(container.querySelector('wa-progress-bar')).toBeTruthy();
  });
});
