import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Animation from './Animation.vue';

describe('Animation', () => {
  it('renders without crashing', () => {
    const { container } = render(Animation);
    expect(container.querySelector('wa-animation')).toBeTruthy();
  });
});
