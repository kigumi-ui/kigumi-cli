import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<ButtonGroup />);
    expect(container.querySelector('wa-button-group')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-button-group', () => {
    const { container } = render(<ButtonGroup className="custom-class" />);
    const element = container.querySelector('wa-button-group');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
