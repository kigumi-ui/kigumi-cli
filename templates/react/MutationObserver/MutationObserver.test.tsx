import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MutationObserver } from './MutationObserver';

describe('MutationObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(<MutationObserver />);
    expect(container.querySelector('wa-mutation-observer')).toBeTruthy();
  });
});
