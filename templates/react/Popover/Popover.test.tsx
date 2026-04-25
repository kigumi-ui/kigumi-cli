import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Popover } from './Popover';

describe('Popover', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popover />);
    expect(container.querySelector('wa-popover')).toBeTruthy();
  });
});
