import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Popup } from './Popup';

describe('Popup', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popup />);
    expect(container.querySelector('wa-popup')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-popup', () => {
    const { container } = render(<Popup className="custom-class" />);
    const element = container.querySelector('wa-popup');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
