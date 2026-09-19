import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<TagInput />);
    expect(container.querySelector('wa-tag-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tag-input', () => {
    const { container } = render(<TagInput className="custom-class" />);
    const element = container.querySelector('wa-tag-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
