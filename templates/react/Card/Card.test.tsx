import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders without crashing', () => {
    const { container } = render(<Card />);
    expect(container.querySelector('wa-card')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-card', () => {
    const { container } = render(<Card className="custom-class" />);
    const element = container.querySelector('wa-card');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
