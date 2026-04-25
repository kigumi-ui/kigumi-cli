import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders without crashing', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('wa-textarea')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-textarea', () => {
    const { container } = render(<Textarea className="custom-class" />);
    const element = container.querySelector('wa-textarea');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
