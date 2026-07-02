import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RandomContent } from './RandomContent';

describe('RandomContent', () => {
  it('renders without crashing', () => {
    const { container } = render(<RandomContent />);
    expect(container.querySelector('wa-random-content')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-random-content', () => {
    const { container } = render(<RandomContent className="custom-class" />);
    const element = container.querySelector('wa-random-content');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
