import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import TreeItem from './TreeItem.vue';

describe('TreeItem', () => {
  it('renders without crashing', () => {
    const { container } = mount(TreeItem);
    expect(container.querySelector('wa-tree-item')).toBeTruthy();
  });
});
