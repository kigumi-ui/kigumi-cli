import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.querySelector('wa-progress-bar')).toBeInTheDocument();
  });

  it('applies value prop', () => {
    const { container } = render(<ProgressBar value={75} />);
    expect(container.querySelector('wa-progress-bar')).toHaveAttribute(
      'value',
      '75'
    );
  });
});
