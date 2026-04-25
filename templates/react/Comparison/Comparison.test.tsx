import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Comparison } from './Comparison';

describe('Comparison', () => {
  it('renders without crashing', () => {
    const { container } = render(<Comparison />);
    expect(container.querySelector('wa-comparison')).toBeTruthy();
  });
});
