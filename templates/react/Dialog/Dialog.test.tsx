import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dialog label="label" />);
    expect(container.querySelector('wa-dialog')).toBeTruthy();
  });
});
