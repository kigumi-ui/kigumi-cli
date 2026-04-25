import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders without crashing', () => {
    const { container } = render(<Radio value="option1">Option 1</Radio>);
    expect(container.querySelector('wa-radio')).toBeInTheDocument();
  });
});
