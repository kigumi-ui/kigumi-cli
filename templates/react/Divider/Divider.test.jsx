import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('wa-divider')).toBeInTheDocument();
  });

  it('applies orientation prop', () => {
    const { container } = render(<Divider orientation="vertical" />);
    expect(container.querySelector('wa-divider')).toHaveAttribute(
      'orientation',
      'vertical'
    );
  });
});
