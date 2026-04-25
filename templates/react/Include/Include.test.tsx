import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Include } from './Include';

describe('Include', () => {
  it('renders without crashing', () => {
    const { container } = render(<Include />);
    expect(container.querySelector('wa-include')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-include', () => {
    const { container } = render(<Include className="custom-class" />);
    const element = container.querySelector('wa-include');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
