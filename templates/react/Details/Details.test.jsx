import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Details } from './Details';

describe('Details', () => {
  it('renders without crashing', () => {
    const { container } = render(<Details summary="Test" />);
    expect(container.querySelector('wa-details')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<Details ref={ref} summary="Test" />);
    expect(ref.current).toHaveProperty('show');
    expect(ref.current).toHaveProperty('hide');
  });

  it('renders children', () => {
    const { getByText } = render(
      <Details summary="Summary">Content here</Details>
    );
    expect(getByText('Content here')).toBeInTheDocument();
  });
});
