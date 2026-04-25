import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tag>Label</Tag>);
    expect(container.querySelector('wa-tag')).toBeInTheDocument();
  });
});
