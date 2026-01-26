import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Animation } from './Animation';
import React from 'react';

describe('Animation', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Animation name="bounce">
        <div>Content</div>
      </Animation>
    );
    expect(container.querySelector('wa-animation')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(
      <Animation ref={ref} name="pulse">
        <div>Content</div>
      </Animation>
    );
    expect(ref.current).toHaveProperty('cancel');
    expect(ref.current).toHaveProperty('finish');
  });

  it('passes animation props', () => {
    const { container } = render(
      <Animation name="bounce" duration={2000} iterations={3}>
        <div>Content</div>
      </Animation>
    );
    const element = container.querySelector('wa-animation');
    expect(element?.getAttribute('name')).toBe('bounce');
    expect(element?.getAttribute('duration')).toBe('2000');
  });
});
