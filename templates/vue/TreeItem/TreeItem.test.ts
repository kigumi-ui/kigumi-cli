import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import TreeItem from './TreeItem.vue';

describe('TreeItem', () => {
  it('renders without crashing', () => {
    const { container } = render(TreeItem);
    expect(container.querySelector('wa-tree-item')).toBeTruthy();
  });
});
