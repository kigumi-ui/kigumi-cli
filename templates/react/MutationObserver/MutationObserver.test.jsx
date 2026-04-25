import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MutationObserver } from './MutationObserver';

describe('MutationObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MutationObserver child-list>
        <div>Content</div>
      </MutationObserver>
    );
    expect(container.querySelector('wa-mutation-observer')).toBeInTheDocument();
  });
});
