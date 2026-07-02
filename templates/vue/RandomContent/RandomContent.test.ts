import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import RandomContent from './RandomContent.vue';

describe('RandomContent', () => {
  it('renders without crashing', () => {
    const { container } = render(RandomContent);
    expect(container.querySelector('wa-random-content')).toBeTruthy();
  });
});
