import React from 'react';
import { render } from '@testing-library/react';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<TagInput />);
    expect(container.querySelector('wa-tag-input')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TagInput className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
