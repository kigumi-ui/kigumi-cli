import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Tag from './Tag.vue';

describe('Tag', () => {
  it('renders without crashing', () => {
    const { container } = render(Tag);
    expect(container.querySelector('wa-tag')).toBeTruthy();
  });
});
