import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Tree from './Tree.vue';

describe('Tree', () => {
  it('renders without crashing', () => {
    const { container } = mount(Tree);
    expect(container.querySelector('wa-tree')).toBeTruthy();
  });
});
