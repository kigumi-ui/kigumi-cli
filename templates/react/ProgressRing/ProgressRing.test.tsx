import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressRing />);
    expect(container.querySelector('wa-progress-ring')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-progress-ring', () => {
    const { container } = render(<ProgressRing className="custom-class" />);
    const element = container.querySelector('wa-progress-ring');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
