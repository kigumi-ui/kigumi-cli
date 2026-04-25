import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TabPanel } from './TabPanel';

describe('TabPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<TabPanel />);
    expect(container.querySelector('wa-tab-panel')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tab-panel', () => {
    const { container } = render(<TabPanel className="custom-class" />);
    const element = container.querySelector('wa-tab-panel');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
