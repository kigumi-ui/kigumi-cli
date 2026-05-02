import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dialog label="Test label" />);
    expect(container.querySelector('wa-dialog')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-dialog', () => {
    const { container } = render(
      <Dialog label="Test label" className="custom-class" />
    );
    const element = container.querySelector('wa-dialog');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('forwards required attributes to the underlying wa-dialog', () => {
    const { container } = render(<Dialog label="Test label" />);
    const element = container.querySelector('wa-dialog');
    expect(element?.getAttribute('label')).toBe('Test label');
  });
});
