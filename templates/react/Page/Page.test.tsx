import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Page } from './Page';

describe('Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container.querySelector('wa-page')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-page', () => {
    const { container } = render(<Page className="custom-class" />);
    const element = container.querySelector('wa-page');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
