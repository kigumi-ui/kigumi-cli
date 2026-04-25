import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SplitPanel } from './SplitPanel';

describe('SplitPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<SplitPanel />);
    expect(container.querySelector('wa-split-panel')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-split-panel', () => {
    const { container } = render(<SplitPanel className="custom-class" />);
    const element = container.querySelector('wa-split-panel');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
