import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FileInput } from './FileInput';

describe('FileInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<FileInput />);
    expect(container.querySelector('wa-file-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-file-input', () => {
    const { container } = render(<FileInput className="custom-class" />);
    const element = container.querySelector('wa-file-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
