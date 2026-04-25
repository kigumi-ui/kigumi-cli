import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Tree from './Tree.vue';

describe('Tree', () => {
  it('renders without crashing', () => {
    const { container } = render(Tree);
    expect(container.querySelector('wa-tree')).toBeTruthy();
  });
});
