import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar />);
    expect(container.querySelector('wa-progress-bar')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-progress-bar', () => {
    const { container } = render(<ProgressBar className="custom-class" />);
    const element = container.querySelector('wa-progress-bar');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
