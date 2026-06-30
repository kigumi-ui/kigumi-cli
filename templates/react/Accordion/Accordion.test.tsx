import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('renders without crashing', () => {
    const { container } = render(<Accordion />);
    expect(container.querySelector('wa-accordion')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-accordion', () => {
    const { container } = render(<Accordion className="custom-class" />);
    const element = container.querySelector('wa-accordion');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
