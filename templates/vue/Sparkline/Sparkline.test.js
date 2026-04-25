import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Sparkline from './Sparkline.vue';

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = render(Sparkline);
    expect(container.querySelector('wa-sparkline')).toBeTruthy();
  });
});
