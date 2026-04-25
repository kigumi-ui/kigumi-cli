import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Details } from './Details';

describe('Details', () => {
  it('renders without crashing', () => {
    const { container } = render(<Details />);
    expect(container.querySelector('wa-details')).toBeTruthy();
  });
});
