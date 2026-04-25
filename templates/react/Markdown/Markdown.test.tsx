import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders without crashing', () => {
    const { container } = render(<Markdown />);
    expect(container.querySelector('wa-markdown')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-markdown', () => {
    const { container } = render(<Markdown className="custom-class" />);
    const element = container.querySelector('wa-markdown');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
