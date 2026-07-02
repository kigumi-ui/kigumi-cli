import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Video from './Video.vue';

describe('Video', () => {
  it('renders without crashing', () => {
    const { container } = render(Video);
    expect(container.querySelector('wa-video')).toBeTruthy();
  });
});
