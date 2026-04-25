import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tree } from './Tree';

describe('Tree', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tree />);
    expect(container.querySelector('wa-tree')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tree', () => {
    const { container } = render(<Tree className="custom-class" />);
    const element = container.querySelector('wa-tree');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
