import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ZoomableFrame from './ZoomableFrame.vue';

describe('ZoomableFrame', () => {
  it('renders without crashing', () => {
    const { container } = render(ZoomableFrame);
    expect(container.querySelector('wa-zoomable-frame')).toBeTruthy();
  });
});
