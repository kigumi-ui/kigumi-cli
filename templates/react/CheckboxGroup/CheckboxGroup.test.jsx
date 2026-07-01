import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CheckboxGroup } from './CheckboxGroup';

describe('CheckboxGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<CheckboxGroup />);
    expect(container.querySelector('wa-checkbox-group')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-checkbox-group', () => {
    const { container } = render(<CheckboxGroup className="custom-class" />);
    const element = container.querySelector('wa-checkbox-group');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
