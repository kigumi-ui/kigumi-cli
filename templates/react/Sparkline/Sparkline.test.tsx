import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = render(<Sparkline />);
    expect(container.querySelector('wa-sparkline')).toBeTruthy();
  });
});
