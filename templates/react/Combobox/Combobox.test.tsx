import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Combobox } from './Combobox';

describe('Combobox', () => {
  it('renders without crashing', () => {
    const { container } = render(<Combobox />);
    expect(container.querySelector('wa-combobox')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-combobox', () => {
    const { container } = render(<Combobox className="custom-class" />);
    const element = container.querySelector('wa-combobox');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
