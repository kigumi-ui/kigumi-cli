import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Scroller } from './Scroller';

describe('Scroller', () => {
  it('renders without crashing', () => {
    const { container } = render(<Scroller>Content</Scroller>);
    expect(container.querySelector('wa-scroller')).toBeInTheDocument();
  });
});
