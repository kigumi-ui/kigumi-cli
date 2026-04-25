import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders without crashing', () => {
    const { container } = render(<Avatar label="Test label" />);
    expect(container.querySelector('wa-avatar')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-avatar', () => {
    const { container } = render(<Avatar label="Test label" className="custom-class" />);
    const element = container.querySelector('wa-avatar');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('forwards required attributes to the underlying wa-avatar', () => {
    const { container } = render(<Avatar label="Test label" />);
    const element = container.querySelector('wa-avatar');
    expect(element?.getAttribute('label')).toBe('Test label');
  });
});
