import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders without crashing', () => {
    const { container } = render(<Textarea label="Message" />);
    expect(container.querySelector('wa-textarea')).toBeInTheDocument();
  });
});
