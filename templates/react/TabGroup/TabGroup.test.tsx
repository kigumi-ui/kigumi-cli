import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TabGroup } from './TabGroup';

describe('TabGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<TabGroup />);
    expect(container.querySelector('wa-tab-group')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tab-group', () => {
    const { container } = render(<TabGroup className="custom-class" />);
    const element = container.querySelector('wa-tab-group');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
