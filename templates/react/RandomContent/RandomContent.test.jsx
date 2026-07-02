import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RandomContent } from './RandomContent';
import React from 'react';

describe('RandomContent', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RandomContent>
        <div>Content</div>
      </RandomContent>
    );
    expect(container.querySelector('wa-random-content')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(
      <RandomContent ref={ref}>
        <div>Content</div>
      </RandomContent>
    );
    expect(ref.current).toHaveProperty('randomize');
  });

  it('passes random-content props', () => {
    const { container } = render(
      <RandomContent mode="sequence" items={2} animation="fade">
        <div>One</div>
        <div>Two</div>
      </RandomContent>
    );
    const element = container.querySelector('wa-random-content');
    expect(element?.getAttribute('mode')).toBe('sequence');
    expect(element?.getAttribute('items')).toBe('2');
  });
});
