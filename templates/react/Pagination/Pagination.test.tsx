import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders without crashing', () => {
    const { container } = render(<Pagination />);
    expect(container.querySelector('wa-pagination')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-pagination', () => {
    const { container } = render(<Pagination className="custom-class" />);
    const element = container.querySelector('wa-pagination');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
