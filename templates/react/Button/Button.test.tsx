import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders without crashing', () => {
    const { container } = render(<Button />);
    expect(container.querySelector('wa-button')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-button', () => {
    const { container } = render(<Button className="custom-class" />);
    const element = container.querySelector('wa-button');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
