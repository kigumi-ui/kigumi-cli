import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CopyButton />);
    expect(container.querySelector('wa-copy-button')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-copy-button', () => {
    const { container } = render(<CopyButton className="custom-class" />);
    const element = container.querySelector('wa-copy-button');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
