import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders without crashing', () => {
    const { container } = render(<Callout />);
    expect(container.querySelector('wa-callout')).toBeInTheDocument();
  });

  it('renders with children', () => {
    const { getByText } = render(<Callout>Test content</Callout>);
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Callout className="custom-class" />);
    const element = container.querySelector('wa-callout');
    expect(element?.classList.contains('custom-class')).toBe(true);
  });

  it('forwards variant prop', () => {
    const { container } = render(<Callout variant="success" />);
    const element = container.querySelector('wa-callout');
    expect(element?.getAttribute('variant')).toBe('success');
  });
});
