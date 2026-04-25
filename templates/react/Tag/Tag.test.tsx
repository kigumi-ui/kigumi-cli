import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tag />);
    expect(container.querySelector('wa-tag')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tag', () => {
    const { container } = render(<Tag className="custom-class" />);
    const element = container.querySelector('wa-tag');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
