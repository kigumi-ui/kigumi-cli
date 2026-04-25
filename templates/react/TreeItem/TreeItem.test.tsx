import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TreeItem } from './TreeItem';

describe('TreeItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<TreeItem />);
    expect(container.querySelector('wa-tree-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tree-item', () => {
    const { container } = render(<TreeItem className="custom-class" />);
    const element = container.querySelector('wa-tree-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
