import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Scroller } from './Scroller';

describe('Scroller', () => {
  it('renders without crashing', () => {
    const { container } = render(<Scroller />);
    expect(container.querySelector('wa-scroller')).toBeTruthy();
  });
});
