import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tab } from './Tab';

describe('Tab', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tab />);
    expect(container.querySelector('wa-tab')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tab', () => {
    const { container } = render(<Tab className="custom-class" />);
    const element = container.querySelector('wa-tab');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
