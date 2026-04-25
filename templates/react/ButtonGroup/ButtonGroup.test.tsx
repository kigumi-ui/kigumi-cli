import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<ButtonGroup />);
    expect(container.querySelector('wa-button-group')).toBeTruthy();
  });
});
