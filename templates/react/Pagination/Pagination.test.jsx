import React from 'react';
import { render } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders without crashing', () => {
    const { container } = render(<Pagination />);
    expect(container.querySelector('wa-pagination')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Pagination className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
