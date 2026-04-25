import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('wa-divider')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-divider', () => {
    const { container } = render(<Divider className="custom-class" />);
    const element = container.querySelector('wa-divider');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
